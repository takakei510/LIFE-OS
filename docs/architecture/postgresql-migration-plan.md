# LIFE OS｜Notion → PostgreSQL 移行設計 v1.0

> ステータス：実装前の設計案／レビュー対象  
> 作成：2026-11-08  
> 対象：LIFE OS Web（Next.js 15 / React 19 / Vercel）  
> **この文書の追加だけではDBの作成・データ移行・本番切替を行わない。**

## 1. 背景と決定

LIFE OSはNotionを初期のセーブデータと公式仕様の管理元として利用してきた。実績数・前提Relation・専門ツリーが増え、将来のクエスト・称号・図鑑・複数プレイヤーを考えると、ゲーム状態の永続化にはリレーショナルDBが適する。

**採用候補：Supabase管理のPostgreSQL。** Supabaseは候補サービスであり、プロジェクト作成・契約・リージョン・認証方式は実装前に承認する。PostgreSQLの標準機能を優先し、特定の管理サービスへのロックインを抑える。

- 移行完了後、**PostgreSQLがゲームデータの唯一の正本**。Notionは企画・アイデア・資料用に残せるが、実績の定義・解除状態の並行編集をしない。
- GitHubは仕様・スキーママイグレーション・コードの正本。NotionとGitHubに同じゲームレコードを二重管理しない。
- 実績設計v2.1（専門ツリー、累計、20時間〜1万時間の設計目安）を継承。移行を口実に実績条件・Tier・XPを変更しない。
- 既存の解除済み記録を取り消さない。移行中も利用者が遊べることを優先する。
- データソースを隠蔽するRepository境界を保ち、UIにSQL・DB接続情報を渡さない。

## 2. 確認済みの現状と未調査事項

GitHub mainのREADMEと `apps/web/package.json`、`docs/architecture/achievement-tree.md` を参照した。

**確認済み**
- Next.js 15.5.28、React 19.1.0、`@notionhq/client`、`@vercel/blob` を利用。
- READMEはNotionをセーブデータと公式仕様書、Supabase/PostgreSQLを将来の正式データ基盤と記載。
- 実績ツリーは複数前提のAND、未発見・Hiddenの非公開、欠損/循環時の解除ガード、既存解除の維持を要求。
- Adventure Logsの任意の文章・場所・写真はNotionに保存。写真はVercel Blob利用の設定がある。
- 既存のNotion実績プロパティにはName、Requirement、Category、Domain、Tier、XP、Unlocked、Unlocked At、Prerequisites、Unlocks、Series Name、Series Order、Lifecycle、Visibility、Evidence関連などがある（Notion接続で確認した例）。

**実装前の監査で確定する**
- すべてのNotionデータソース・プロパティ型・Relation先・formula/rollupと各件数。
- すべての読取・書込箇所、APIルート、キャッシュ、cron、認証、画像参照、レベル/XP計算式。
- 実績以外の称号、クエスト、Status、Adventure Logs、受注・解除の状態遷移。
- 既存IDの衝突・欠損・削除済みページ・孤立Relation・非Active実績。
- Supabase/Vercelの料金・制限・リージョン・バックアップ要件（導入時の最新条件で確認）。

## 3. 論理アーキテクチャ

```text
Browser (公開DTOのみ)
  └─ Next.js Server / Route Handlers (認証・認可・操作ガード)
       ├─ Application services (XP / unlock / quest / discovery)
       └─ Repository interface
            ├─ PostgreSQL adapter [移行後の正本]
            └─ Notion adapter [移行中の読取・退避]
PostgreSQL ← バージョン管理されたSQL migrations
Notion      ← 移行後は企画・ドキュメント専用
Vercel Blob ← 画像バイナリの既存保存先（必要なら継続）
```

本番のDB接続はサーバー側に限定。ブラウザに管理者キー・DB URL・非公開実績の生データを送らない。認証方式に応じてPostgres RLSを併用し、**RLSだけに依存せずサーバーで操作可否を再検証**する。

## 4. 推奨データモデル（論理設計）

**基本原則**：UUIDなど内部主キーと、既存Notionの識別子を別に保持する。移行後も安定した実績識別子を使い、URLや表示名をキーにしない。Notion IDは移行監査用の一意な外部キーとして保持。

| テーブル | 主な列（案） | 制約・目的 |
| --- | --- | --- |
| `achievements` | id, legacy_notion_id, legacy_code, name, requirement, category_id, tier, xp, lifecycle, visibility, flavor_text, domain, series_id, series_order | 定義の正本。legacy IDは一意、XP非負 |
| `achievement_prerequisites` | achievement_id, prerequisite_id | 複合PK、自己参照禁止、循環はアプリ/DB操作で検証 |
| `achievement_series` | id, slug, name, description | 読書・映画・ギター等の専門ツリー。カテゴリと分離 |
| `achievement_series_memberships` | achievement_id, series_id, sort_order | 将来の複数所属を許容。初期はNotion Series Nameから変換 |
| `categories` | id, slug, label | 共通カテゴリの正規化。旧値との対応表を作る |
| `players` | id, auth_subject, display_name, created_at | 将来の複数ユーザー。認証主体の一意制約 |
| `player_achievements` | player_id, achievement_id, unlocked_at, evidence_note | 複合PK、一度だけ解除。実績定義と個人状態を分離 |
| `player_discoveries` | player_id, cluster_id, set_version, discovered_at | 発見記録。再送で重複しない |
| `achievement_clusters` | id, slug, label | 意味上のクラスタ（表示上の連結成分とは別） |
| `cluster_memberships` | cluster_id, achievement_id | 複数所属を許容 |
| `cluster_target_sets` | id, cluster_id, version | 公開済み対象集合は不変 |
| `cluster_target_members` | target_set_id, achievement_id | 明示的・非空の対象集合 |
| `cluster_unlock_rules` | source_target_set_id, target_cluster_id, root_achievement_id | 発見のAND条件。実装前に整合性検証 |
| `titles`, `player_titles` | 定義 / 個人の取得・装備状態 | 称号の管理 |
| `quests`, `player_quests` | 定義 / 個人の受注・完了状態 | クエストの管理 |
| `adventure_logs`, `adventure_log_photos` | player_id, 日時, 文章, 場所 / Blob URL・順序 | ログと写真メタデータ。画像本体の複製は不要 |
| `import_batches`, `legacy_id_map` | import_id, source, checksum, imported_at / 旧ID→新ID | 再実行可能な移行と監査 |

**暫定事項**：Status・XP/Level・報酬・称号解除条件・クエスト関連の正規化は実装監査後に確定する。未確認の既存値を架空の列へ無理に割り当てない。

### XPとレベル

- XPは実績定義の値を維持し、獲得XPは `player_achievements` と定義のJOINから算出する（同一解除の二重計上を防ぐ）。
- 過去のXPルール改定に備え、将来必要なら解除時XPスナップショット/台帳を別途設計。**現行計算式を確認するまで自動変更しない**。
- Level計算・カテゴリ別進捗は既存表示と同じ値を返すことを移行受入条件とする。

### 前提・秘密表示・解除

- `achievement_prerequisites` はAND。孤立参照・循環・不完全な読み取りは**解除可能と判定しない**。
- 解除APIは認証したplayer_idとサーバー側の最新前提を照合し、トランザクション内で一度だけ `player_achievements` にINSERT。再送は日時/XPを変更しない。
- 既存解除済み実績に後から前提を付けても解除記録は保持する。
- 未発見の名前・条件・XP・Tier・元ID・URLを公開DTOへ含めない。Hiddenの未解除はノード自体を返さない。URL直打ち・検索・HOME候補も同じポリシー。
- クラスタ発見の公開は、固定版セット・永続記録・認証・循環検査が揃うまで保留する。

### 個人データと認証

- **移行初期は既存の単一プレイヤーを1行に対応付ける**。現行アプリの操作認証を監査し、移行時に第三者が解除できないよう保護する。
- 将来の複数ユーザーではSupabase Auth等を候補とするが、既存の単一ユーザー状態と認証主体の紐付けは明示的な承認手順にする。
- RLSの例：プレイヤーは自分の `player_achievements` と `adventure_logs` のみ参照・更新可能。ただし実績解除は直接INSERTを許さずサーバーの検証済み操作経由。
- ログや写真の公開範囲は非公開を既定とし、将来のプロフィール公開とは分離する。

## 5. データ移行仕様

### 抽出
1. Notionの全関連データソースを**ページネーションしながら**取得し、途中失敗を成功扱いしない。
2. 取得日時・件数・元ID・プロパティ・Relation・アーカイブ状態を保持した**非公開スナップショット**を作る。秘密情報や個人ログをGitHubへコミットしない。
3. Notion formula・rollup・Relationは必要なページ/プロパティ取得APIで完全展開し、欠損を監査表に記録する。

### 変換
1. legacy Notion ID → DB IDを固定マッピングし、再実行しても同じレコードへUPSERT。
2. カテゴリ・Tier・Lifecycle・Visibility・Domainの値を既存値から対応表で変換。未知値は推測せずエラー/隔離。
3. 実績定義とプレイヤー解除状態を分離。既存の `Unlocked` / `Unlocked At` を**初期プレイヤーの解除履歴**に変換し、日時が不明なら不明と記録して勝手に補完しない。
4. 前提Relationは両端の存在と向きを検証。逆方向の `Unlocks` との整合性を照合し、逆Relationを二重登録しない。
5. 既存の写真URLは参照を維持し、画像ファイルを勝手に公開・複製しない。
6. 日付はタイムゾーン付きUTCに正規化。元の日本時間表示の意味を保持する。

### 検証
- データソース別の件数、ID集合、カテゴリ・Tier・XP合計、解除済み件数、解除日時、前提辺の集合、アーカイブ・Hidden件数を照合。
- 前提グラフの自己参照・循環・孤立・多重辺、未発見/Hiddenの漏えい、累計実績の条件を検証。
- HOME / Achievements / Tree / Titles / Quests / Status / Adventure Logsの表示差分を自動テスト＋手動確認。
- 実績解除、同一リクエスト再送、複数リクエスト同時送信、未解除前提、権限外操作、写真表示を検証。
- 不一致が一件でもあれば**本番切替を保留**し、差分の原因を記録。既知の例外はユーザー承認の上で個別に扱う。

## 6. 切替・ロールバック

1. **監査**：Notion API・リポジトリの全読書き箇所とデータ定義を棚卸し。
2. **DB準備**：Supabaseプロジェクト・バックアップ・最小権限・接続設定。スキーマSQLはPRレビュー。
3. **初回インポート**：Notionを正本のままPostgresへコピーし、差分照合。
4. **シャドーリード**：本番レスポンスはNotionのまま、サーバー内でDB結果を比較（秘密情報をログに出さない）。
5. **短時間の書込停止**：解除・クエスト受注・ログ追加を一時停止し、最終差分同期。**二重書込を通常運用しない**。
6. **切替**：環境設定の読取/書込先をDBへ一括変更。サーバー側で安全な切替フラグを用意し、旧APIからの書込を遮断。
7. **監視**：エラー、件数、XP、認証、解除、画像参照を確認。Notionは読取専用バックアップとして保持。
8. **ロールバック**：読み取りだけなら旧Notionへ戻せるが、DB切替後に新しい解除・ログが書き込まれた場合、**Notionへ単純に戻すとデータを失う**。復旧時は書込停止→DB増分エクスポート→Notionへの安全な反映またはDB修復を行い、整合性確認後に再開する。

**不可逆操作を避ける**：Notionの削除、DBデータの破棄、既存Blobの削除は移行完了の別承認まで禁止。

## 7. 実装フェーズとPRの分離

| Phase | 成果物 | 完了条件 |
| --- | --- | --- |
| 0 現状監査 | Notion schema inventory、コードのread/write一覧、データ件数・リスク表 | 未調査項目の解消 |
| 1 DB設計 | SQL migrations、ER図、権限/RLS設計、テスト用seed | レビュー承認、既存機能に影響なし |
| 2 移行ツール | read-only export、idempotent import、差分レポート | テストデータで再実行一致 |
| 3 Repository置換 | PostgreSQL adapter、契約テスト、シャドーリード | 既存DTO/操作ガードの互換 |
| 4 本番移行 | 最終同期、切替、監視、復旧手順 | 全受入条件合格・ユーザー承認 |
| 5 整理 | Notion runtime依存除去、ドキュメント更新 | 正本が1つ、旧データは退避 |

各Phaseは別PR。**本番DB作成、契約、認証設定、データ移行、環境変数変更、本番切替は、それぞれ実行前に明示的に確認する。** 既存の実績ツリー/デザインPRとは混ぜない。

## 8. 受入条件

- [ ] 既存の全レコードとRelationが、欠損・重複なく照合できる
- [ ] 解除済み件数・日時・XP・Levelが移行前と一致する
- [ ] 非公開実績の情報がクライアント・API・ログに漏れない
- [ ] 前提AND・循環/欠損ガード・解除の冪等性が維持される
- [ ] クエスト/称号/Status/Adventure Logs/写真が従来どおり動作する
- [ ] 単一プレイヤーの認可が確認され、他者が解除操作できない
- [ ] 読取/書込の正本がPostgreSQLに一本化される
- [ ] 切替後の増分を含めた復旧手順が試験済み
- [ ] スキーマ/移行ツール/手順がGitHubで版管理され、秘密データは含まれない

## 9. 判断待ち

1. Supabaseを採用するか（PostgreSQL自体は推奨）。
2. 初期は単一プレイヤーのまま移行するか、認証を同時導入するか（**推奨：単一プレイヤーの移行を先行、認証は安全性の最低条件を確保して別フェーズ**）。
3. DBリージョン、無料枠・課金上限、バックアップ保持方針。
4. 移行時の短時間の書込停止タイミング。
5. 将来のプロフィール公開範囲。

## 10. 関連仕様

- `docs/architecture/achievement-tree.md`：前提AND・公開境界・秘密表示・クラスタ
- `docs/spec/achievement-design-v2.md`（PR #77）：実績コンテンツ設計v2.1。**未マージならmain上には存在しない**ため、実装時に取り込み状態を確認する。
- `docs/MVP_SETUP.md`：現行セットアップ

> LIFE OSは「何者になるか」を競うゲームではない。「どれだけ世界に触れ、どれだけ深く楽しんだか」を表現するゲームである。
