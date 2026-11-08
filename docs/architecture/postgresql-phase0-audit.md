# LIFE OS｜Phase 0 現状監査報告 v0.1

> 2026-11-08／監査対象：GitHub main と接続済みNotionの**スキーマ**。  
> 状態：**部分完了（データ全件監査・本番設定の照合は未完了）**。このPRはドキュメントのみ。  
> 関連：`docs/architecture/postgresql-migration-plan.md`（PR #78、未マージ）

## 1. 監査の目的と範囲

Notion → PostgreSQL移行に先立ち、既存のデータソース、読み書き経路、計算・認可・非公開境界を明らかにする。監査中にNotionのレコード変更、Supabaseプロジェクト作成、本番設定変更はしない。

### 調査方法

- GitHub mainの再帰ツリーと関連TypeScriptソースを読取。
- Notionの各data source定義を`fetch`で読取。**SQL/rowsモードの全件クエリは利用枠により未実施**。
- リポジトリ内の環境変数の**名前のみ**を確認。Vercel本番の値・権限・保護状態は未確認。

## 2. システム構成（コードから確認）

| 項目 | 実装 | 根拠 |
| --- | --- | --- |
| フロント/サーバー | Next.js 15.5.28 / React 19.1.0 | `apps/web/package.json` |
| Notion SDK | `@notionhq/client` 5.22.0 | `apps/web/package.json` |
| Notion接続 | server-only client、API version 2026-03-11 | `apps/web/lib/notion/client.ts` |
| 写真 | `@vercel/blob` とNotionのMediaプロパティ | `package.json`、adventure-logs repository |
| 読取統合 | `getLifeOsSnapshot()`、`unstable_noStore` | `apps/web/lib/notion/snapshot.ts` |
| ツリー | 複数前提AND・循環/欠損ガード・公開DTO | `docs/architecture/achievement-tree.md`、`achievement-tree.ts` |
| 設定 | Notion必須4データソース＋Adventure Logs任意 | `apps/web/lib/env.ts` |

### データの流れ

```text
Notion Achievements ─┐
Notion Titles ───────┤
Notion Quests ───────┼→ getLifeOsSnapshot → 公開用変換 → Next.js画面
Notion PLAYER ───────┤
Notion Logs ─────────┘

実績解除 Server Action → unlockAchievementPage → Notion.pages.update
クエスト操作 Server Action → quest service → Notion.pages.update
ログ作成 Server Action → adventure log service → Notion.pages.create
写真追加 → Blob/Notion file_upload + Media更新（詳細フロー要追加監査）
```

## 3. Notionデータソース一覧（スキーマ確認済み）

| 名称 | Notion data source ID | 主な内容 |
| --- | --- | --- |
| 🏆 人生実績リスト | `2d9391a3-54a9-80a0-a654-000b06ca4214` | Name、Requirement、Tier、XP、Unlocked、Unlocked At、Lifecycle、Visibility、Category、Domain、Prerequisites、Unlocks、Series Name/Order、Evidence、Player、関連ログ/称号/クエスト |
| 👑 称号リスト | `6b08b0c1-c564-47eb-b16f-a10fa3d2c6f9` | Name、Tier、Requirement Type/Text、Required Count、Required Achievements、Unlocked/At、Equipped、Player |
| 📅 クエスト | `fcaa087b-dc57-4ba1-9293-91b6323a1ca6` | Name、State、Quest Type、Reward XP、Earned XP、Is Completed、Repeatable、Available From、Due At、Completed At、Player、関連実績・ログ |
| 🎮 PLAYER STATUS | `a330b910-cdc1-4b30-a859-97b52511900b` | Name、Achievements/Titles/Quests Relation、Achievement XP・Quest XP Rollup、Total XP・Level・Next Level XP・Progress・Player Rank Formula、取得件数 |
| 📸 Adventure Logs | `e76272d6-1a55-4c2f-a90d-0baf93c48ed3` | Name、Memo、Location、Logged At、Log Type、Visibility、Favorite、Media、Request ID、Player、関連実績/クエスト/称号 |

上記IDは**データソースの識別子**であり秘密鍵ではないが、実運用の接続情報や個人ログの中身はGitHubに保存しない。現行環境変数の値がこれらと一致するかは未確認。

### 実績スキーマ固有の注意

- `Unlocked`（checkbox）と`Unlocked At`（date）は実績定義側にあり、プレイヤー単位に分離されていない。
- `Prerequisites` / `Unlocks` は実績自身へのRelation。前提辺の正本は`Prerequisites`とし、逆方向は照合用。
- `Earned XP` はFormula。単純なSQL列へのコピーはしない。
- `Series Name` はtext、`Series Order` はnumber。移行先ではシリーズの安定IDを設ける。
- `Domain` はmulti_select、`Category`はselect。1つのカテゴリに複数ドメインを持てる。
- `Tier` は絵文字付きの選択肢（⭐ Common等）。コード上のTier型は文字列も許す。移行時に無断で正規化しない。
- `Lifecycle` はActive/Draft/Archived、`Visibility` はVisible/Hidden。
- `ID` はNotion自動採番。**ページUUIDと別の識別子**として保存要否を確認する。
- `Evidence Headline/Note/Source/Strength`、`Notes`、`種別`も存在。使用状況が不明でもデータ欠損させない。

## 4. コード上の読取・書込マップ（確認済み）

| コード | 読取 | 書込 | 移行時の要点 |
| --- | --- | --- | --- |
| `lib/notion/repositories/achievement-tree.ts` | Active実績を全ページ読取。Relationは必要に応じ別途ページング | なし | 関係の完全性、公開境界 |
| `lib/notion/repositories/achievements.ts` | 対象実績、全ツリー | Unlocked/Unlocked At | 解除の冪等性・ANDガード |
| `lib/notion/repositories/quests.ts` | PLAYER、Activeかつ所属するクエスト | State | PLAYER一意性、revisionによる競合検知 |
| `lib/notion/repositories/adventure-logs.ts` | ログ一覧、Request ID、PLAYER | ログ作成、Media/Log Type | Request IDで再送対策、写真参照、所有者 |
| `lib/notion/repositories/guide.ts` | Active実績・クエスト | なし | Hidden/未発見除外、関連実績 |
| `lib/notion/snapshot.ts` | 実績、称号、クエスト、PLAYER、ログ | なし | 公開DTOとStatus値の一致 |
| `app/actions/achievement-actions.ts` | repository経由 | 実績解除 | 現行コードでは独立の認証チェックは確認できない。デプロイ保護要確認 |
| `app/actions/quest-actions.ts` | service/repository経由 | 受注/取消 | `QUEST_ACTIONS_ENABLED`で操作制御、デプロイ保護前提のコメントあり |
| `app/actions/adventure-log-actions.ts` | service経由 | ログ作成 | 写真・日時・関連実績の検証を継承 |
| `app/api/guide/*`、`app/api/adventure-logs/*` | 追加監査対象 | 一部で書込の可能性 | APIルートの権限・保護・期限付き写真URLを要確認 |

### 追加の注意点

- `getLifeOsSnapshot()` はNotion読取に失敗すると空配列・nullのfallbackを返す。移行中の比較では**空の結果を「0件」と誤認しない**。
- `snapshot.ts` のPLAYER選択は`statusPages[0]`。`quests.ts`ではName=PLAYERの一意性を検証。**選択条件に差がある**ため、移行先で一意なプレイヤーを明示する。
- `quests.ts` はNotionページの`last_edited_time`をrevisionとして利用。PostgreSQL側でversion列等を用意し、競合制御の意味を維持する。
- `adventure-logs.ts` はRequest IDによる重複検出、Mediaの上書き防止を実装。DBでは一意制約とトランザクションで再現する。
- `achievement-tree.ts` はActiveのみ読み込む。**移行エクスポートはActiveだけでなくDraft/Archivedも含める**必要がある。
- Notion側の`Player` Relationや`Earned XP` Formulaの詳細定義は未取得。現状の総XP計算を推測して置き換えない。

## 5. 移行リスクと対策

| 優先度 | リスク | 対策 |
| --- | --- | --- |
| Critical | 認証/所有者判定を誤り、他人の実績やログを操作できる | 本番デプロイ保護・Server Actions・APIルート・DB RLSを監査し、権限テスト |
| Critical | Hidden/未発見実績の情報漏えい | クライアントDTO、検索、URL直アクセス、AI Guideを横断検査 |
| High | XP/LevelがFormula/Rollupと一致しない | Notion式の取得、実例比較、移行後の計算テスト |
| High | 解除済み状態や前提Relationの欠落 | 全件エクスポート、ID/辺集合/日時の照合 |
| High | 写真・メディアの参照が切れる | Notion file_uploadとBlobの保存先・有効期限を棚卸し |
| High | 同時書込・再送で状態が重複 | DB一意制約、冪等キー、トランザクション |
| Medium | NotionのAPI制限で抽出が途中終了 | バックオフ、再開可能カーソル、チェックサム |
| Medium | UIのNotion URLやページIDへの依存 | 互換ID/内部ルーティング、表示差分テスト |

## 6. Phase 0完了までの未解決事項

- [x] GitHub mainの全ファイルパスを取得（再帰ツリー、truncated=false）
- [x] 主なNotionデータソース5つのスキーマを取得
- [x] 主なRepository・Server Actionsの読書き経路を特定
- [ ] 全5データソースの**全件数**、Active/Draft/Archived、解除件数、Hidden件数を取得
- [ ] 全件のRelation、重複、孤立、循環、解除日時、XPを照合
- [ ] Notion Formula/Rollupの**式そのもの**を確認し、XP/Level計算を確定
- [ ] 残りのAPIルート・写真サービス・クエストservice・各画面の直接Notion依存を監査
- [ ] Vercel本番の認証/デプロイ保護・環境変数の**存在と設定状態**を確認（値・トークンは記録しない）
- [ ] Notionの全データソースが実運用の接続先と一致することを確認
- [ ] 移行用の安全な全件エクスポート方法、バックアップ・復旧方針を検証

**判定：Phase 0はまだ完了ではない。** 本番移行やスキーマ確定へ進む前に上記未完了項目を埋める。

## 7. 次のアクション

1. 読取専用でNotionの全件・Relation・Formula定義を取得し、**個人データを外部公開しない監査集計**を作る。Notion Query Data Sourceの利用枠が回復した時点で実施可能。
2. 未読のAPIルート・写真処理・Vercel保護設定を監査し、リスクを更新する。
3. 監査結果を反映して移行設計v1.0の論理スキーマを具体的なSQL migrationsへ落とす（別PR・別承認）。
