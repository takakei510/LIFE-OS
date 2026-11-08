# LIFE OS｜Phase 0 現状監査報告 v0.1

> 2026-11-08／監査対象：GitHub main と接続済みNotionの**スキーマ**。  
> 状態：**部分完了（件数・主要Vercel設定確認済み。全件Relation/式・認可実地検証は未完了）**。このPRはドキュメントのみ。  
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

## 8. 追加監査（2026-11-08）

### 8.1 Notion SQL集計：実データ件数（読取専用）

| Data source | 合計 | 内訳 |
| --- | ---: | --- |
| Achievements | **303** | Active/Visible/未解除234、Active/Visible/解除済6、Archived/Visible/未解除63 |
| Titles | **27** | Active/未解除/未装備27 |
| Quests | **115** | Active/Available115 |
| PLAYER STATUS | **1** | 1行 |
| Adventure Logs | **2** | Active/Private2 |
| **合計** | **448** | 取得時点のスナップショット |

実績のXP列合計：Active/Visible/未解除6,675、Active/Visible/解除済65、Archived/Visible/未解除855。**これらはXP定義の合計であり、PLAYERのTotal XPやクエストXPではない。** 集計ではHidden行が返らなかったが、後日の追加・別ソースの可能性を前提にHidden対応は維持する。SQLの件数確認と**全件エクスポートの完全性検証は別**。

### 8.2 Vercelプロジェクト設定（秘密値は取得・記録しない）

- プロジェクト：`life-os-web-m3ds`（Vercel接続で確認）。
- `ssoProtection.enabled = true`、`deploymentType = all_except_custom_domains`。Password Protectionはfalse。
- **重要**：カスタムドメインへの適用は上記設定では例外。現時点で表示されたドメインがすべて保護されるか、ブラウザからの未認証アクセス検証は未実施。Vercelプロジェクトの`live=false`と最新deploymentの`READY`は異なる指標であり、公開可否を推測しない。
- 本番・Previewに`NOTION_TOKEN`、Achievements/Titles/Quests/StatusのData Source IDが設定済み。Adventure Logs IDは本番とPreviewに設定済み。値の一致は未確認。
- `BLOB_READ_WRITE_TOKEN`はproduction/preview/development、`CRON_SECRET`はproduction/previewに設定済み。
- `QUEST_ACTIONS_ENABLED`、`PHOTO_UPLOADS_ENABLED`の本番設定が存在。Previewはブランチ別設定あり。**設定の存在は全経路の認可・安全性を保証しない。**

### 8.3 API/写真/ガイドの追加コード監査

- `app/api/adventure-logs/photos/route.ts`：Originチェック、`PHOTO_UPLOADS_ENABLED`・Blobトークン、Cookie/署名grantによる制御。Vercel Authenticationの保護を前提にしている。DB移行後のプレイヤー所有者との結びつけが必要。
- `app/api/adventure-logs/photos/cleanup/route.ts`：`CRON_SECRET` Bearerトークンをタイミング安全比較し、期限切れの一時Blobを削除。
- `lib/life-os/adventure-logs/photo-storage.ts`：Vercel Blobに一時保存し、Notionのfile uploadへ転送。**NotionのMediaを単にDBのURL文字列へ置換しても写真の永続性は保証されない**。移行前にオリジナルの保存先・有効期限・移行方針を確定する。
- `app/api/guide/route.ts`：Previewと2つの有効化フラグを必要とし、Origin/入力サイズ/クールダウンを検証。移行後も公開用カタログだけを参照。
- `app/api/guide/export/route.ts`：OriginとJSONチェック後にNotionの公開候補カタログを読む。公開情報の境界はrepositoryとserviceの両方で維持。
- `app/api/notion-health/route.ts`：Notion Snapshotの読取結果をhealthとして返す。DB移行後はDB版に置換し、秘密情報や全件詳細を返さない。
- `lib/life-os/quests/service.ts`：操作対象のID、所有者、状態遷移、revisionを検証。Postgresで楽観ロックを再現する。
- `lib/life-os/achievement-tree/model.ts`：前提グラフ・未発見マスクを実装。公開DTOをDBアクセスから独立させる必要がある。

### 8.4 Phase 0残作業の優先順位

1. **Critical**：SSO保護がproduction/preview/カスタムドメイン/Server Actions/APIに及ぶか、未認証アクセスの実地テスト。
2. **High**：NotionのFormula/Rollup定義（Total XP、Level、Progress、Achievement XP、Quest XP等）を完全取得し、移行前後の値の照合基準を確定。
3. **High**：全303実績の前提Relationの完全性、循環、孤立、逆Relation整合性と解除日時、他4データソースのRelationの全件照合。
4. **High**：写真のNotion file_upload、Blobステージング、期限・アクセス権の実地監査。
5. **Medium**：Notion実行環境変数のID一致確認（秘密値を記録しない）と残る画面/APIの網羅的静的依存監査。

**Phase 0の完了判定は引き続き保留。** 本番DBの作成や移行・切替は行わない。

## 9. 前提Relationと解除履歴の追加集計（2026-11-08）

Notionの読取専用SQL集計で以下を確認した。

| 検査項目 | 結果 | 解釈 |
| --- | ---: | --- |
| 実績レコード数 | 303 | 全Lifecycle込み |
| Notion自動採番IDの異なり数 | 303 | IDの重複は検出されなかった。ただしNULLがないことは別途確認要 |
| Prerequisites Relation要素数 | 39 | **辺の総数** |
| Unlocks Relation要素数 | 39 | 逆向きの**辺の総数** |
| Unlocked=trueでUnlocked At未設定 | 0 | 解除済み6件の日時欠損なし |

**重要**：前提39本と逆Relation39本が同数であっても、各辺が互いに一致する保証はない。孤立・自己参照・循環・逆Relationの差分を抽出するSQLは、NotionのQuery Data Source利用枠上限に達し実行できなかった。実行されていない検査を合格扱いしない。

PLAYER STATUSのFormula/Rollupはschemaに`codeUrl`・`aggregation`が存在することを確認。Formulaの**式本文**はこの接続のfetch/queryから取得できず、Total XP/Level/Next Level XP/Progress/Player Rankの正確な再現は未確定。別途Notion公式APIのproperty schema取得またはNotion UIで式を確認し、実値と併せて記録する。

### ブロッカー

Notion Query Data SourceのSQL/rowsモードのワークスペース利用枠に達したため、残りの完全性検査は実行不可。上限はおおむね60分以内にリセットされる案内。**利用枠を迂回するための推測値や部分抽出を全件結果として扱わない。** 保存済みViewがある場合はViewモードで取得可能だが、適切なview URLの特定と全件性の確認が必要。

### 現時点の判定

Phase 0：**継続中**。前提辺の完全性、式本文、全データのスナップショット、未認証アクセスの実地検査、写真ファイルの永続性の確認が未完了。データベース本番切替の承認条件は満たしていない。

## 10. 認証・写真・読取経路の詳細静的監査（継続調査）

### 10.1 書込経路と保護境界

| 操作 | サーバー側の検査 | 未確定リスク |
| --- | --- | --- |
| `unlockAchievementAction` | FormDataの実績ID、Notion親データソース、Active、前提AND・非公開状態を検査 | **アプリ固有のログイン/プレイヤー認証なし**。Vercel SSO保護を信頼。並列解除の競合はDB移行時にトランザクション化 |
| `changeQuestAction` | `QUEST_ACTIONS_ENABLED`、所属PLAYER・Active・revision・期間・状態遷移 | Vercel SSO前提。個別ユーザー認証・認可は未実装 |
| `createAdventureLogAction` | 入力検証、解除済み関連実績、Request ID重複チェック、写真grant | Vercel SSO前提。プレイヤーIDはサーバー側で固定・解決 |
| `/api/adventure-logs/photos` | Origin、Feature flag、署名grant、Cookie、一時保存制限 | 同一オリジンとCookieは**本人認証の代替ではない**。DB移行後はplayer_idへ結びつける |
| `/api/adventure-logs/photos/cleanup` | CRON_SECRET Bearerをtiming-safeで比較 | シークレット保管・ローテーション・スケジュール監査 |
| `/api/guide` | Previewのみ・二重Feature flag・Origin・サイズ・クールダウン | 本番有効化しない前提を継承 |
| `/api/guide/export` | Origin・入力形式・公開候補のRepositoryフィルタ | フィルタ漏れによるHidden漏えいを回帰テスト |
| `/api/notion-health`、`/api/adventure-logs/health` | 構成と接続状況を返す | 認証経路の実地確認と、不要なメタ情報公開を防ぐ |

**判断**：現在の単一プレイヤー設計では、アプリ独自のユーザー認証ではなくVercel Authentication（SSO）に強く依存する。PostgreSQLの複数ユーザー化時にこの前提を持ち込まない。ユーザー所有権のDB制約とServer Action側の認可が必要。

### 10.2 写真のライフサイクル（コード確認）

1. ブラウザのアップロードを`/api/adventure-logs/photos`で検証し、Vercel Blobの**private staging**へ置く。
2. サーバー側でサイズ・Content-Typeを再検証し、`notion.fileUploads.create/send`へ転送。
3. Notion `Media` propertyにアップロード済みファイルを関連付ける。
4. `vercel.json`のcron `0 18 * * *`で一時Blobをクリーンアップ（`CRON_SECRET`検証）。

**移行方針の修正提案**：Notion Mediaの署名付き/期限付きURLをPostgresに永久URLとしてコピーしない。移行先の**長期保管用オブジェクトストレージ**（Supabase Storage private bucketなど）にオリジナルファイルを移し、DBには安定したオブジェクトキー、所有者、MIME、サイズ、順序を保存する。画像取得時は短命署名URL等で配信する。Notion上のMediaを破棄する前に画像実体の照合を必須とする。

### 10.3 Notionの読取整合性

- `readAchievementTreeRecords`はActiveのみページングし、Relationが100件超ならproperty paginationを利用。Relation取得失敗は`relationComplete=false`として解除を防ぐ。
- `getLifeOsSnapshot`はツリー、称号、クエスト、PLAYER、ログを並列取得する。いずれかのエラーでfallbackの**全件空配列**を返す。DB移行の件数検証ではこのfallbackを正常データと混同しない。
- `queryAll`（称号・PLAYER）はカーソル再訪・`has_more`でnext_cursor欠損の検知がない。移行用exportでは**独立した堅牢なページング処理**を使用。
- `unlockAchievementPage`はNotion側のUnlockedを先に確認し、既存解除ならそのまま返す。Action側はその場合も新規に作成した`unlockedAt`を返すため、UIに返す時刻とNotionの実際の解除日時が異なりうる。DB移行時に**既存解除時刻を返す**契約へ改善する（移行と別PRで変更）。
- `achievement-tree/model.ts`はHidden未解除の内容を公開DTOで隠す。DB移行では**DBからの取得段階で全情報を返さないAPI契約**を設ける。

### 10.4 本番での実地検査が必要な項目

- 未ログインのブラウザからproduction/preview/独自ドメインへのGET、POST、Server Actions呼出しが遮断されること。
- 認証済みであっても他プレイヤーのIDを送信した操作が拒否されること（複数ユーザー化後）。
- Hidden/未発見実績がAPI JSON・ページソース・検索・AI Guide・health経由で漏れないこと。
- 画像URLの有効期限・権限、アップロード途中の障害復旧、staging削除後の永続表示。
- Vercel SSOの`all_except_custom_domains`が運用するすべてのドメインに期待通り適用されること。**未認証アクセス試験はまだ実施していない**。

### 10.5 調査の制約

NotionのSQL/rows Query Data Sourceは再び利用枠上限で実行不可。**前提39本の完全な辺照合・循環検査は未実施**。FormulaはNotionスキーマ上の`formulaCode://`参照のみ確認でき、式本文の取得を試みたがfetchではvalidation_error。Notion UI/公式API経由での式本文確認が必要。

**判定**：Phase 0は部分完了。認可の実地検証、Formula本文、前提Relationの全件照合、写真実体の移行可能性を未解決として維持。
