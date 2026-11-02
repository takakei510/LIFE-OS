# 日常利用MVPの初期設定と公開確認

2026-11-02、本人の写真付き記録による保存・再表示確認と公開承認を経て、写真対応MVPを本番へ反映します。以下は継続運用と再設定のための手順です。

## 今回使えるようにする範囲

実績・称号・クエスト・ステータスを閲覧し、実績を解除したあと、必要なら文章・場所・写真を思い出として残す。写真なしでも遊べる。記録によるXP付与、毎日の入力要求、記録しない場合のペナルティは設けない。

Googleログイン・Google フォト選択・音声・クエスト状態の変更・称号装備は今回の写真対応に混ぜない。Google フォト連携を追加する場合も、本人が選んだ写真だけを取り込む独立した入口とする。

## 調査で確認したこと

- #39〜#42は統合済み、#34はDraft。#43の旧CIも成功済みだった。
- 本番mainは`14e8a680310b8ec70f62221c4c819447e15a5133`でREADY。HOMEはNotionの実データを表示した。
- Vercelの設定は`all_except_custom_domains`による保護。アプリ内ログインは未実装。未保護のカスタムドメインを追加しない。
- 冒険ログDBは存在し、必要なRequest ID / Media / Playerなどの構造を読み取りで確認した。
- 冒険ログの接続先がVercelに未設定だった。previewだけに接続先を追加。本番設定は公開時に行う。
- 非公開Blob `life-os-photo-staging`を東京に作成し、既存プロジェクトへ接続した。公開Blobや恒久的な画像コピーは作らない。

## 写真の仕様

- JPEG / PNG / WebP、最大5枚、1枚5MiB以下（5 × 1,024 × 1,024バイト）。Notion無料プランに合わせた制限。
- 元画像を再圧縮・再エンコードしない。EXIFの位置情報等も残るため、画面で案内する。
- アニメーションや40メガピクセル超の画像は拒否。HEICは今回未対応。
- 写真を選び、アップロード完了後に「保存する」を押す。写真を削除して文章だけでも保存できる。
- アップロード認可は10分、保存用バッチは45分。期限切れの場合は写真を選び直す。
- 文章・場所の保存と写真添付は分離。添付失敗時は文章を残し、同じrequestIdで再試行する。既存実績解除は取り消さない。

## 接続と環境変数

対象は既存Vercel team / project `life-os-web-m3ds`。値やトークンをPRやチャットへ貼らない。Vercelの環境変数設定に入力する。

| 名前 | 用途・設定 |
| --- | --- |
| `NOTION_TOKEN` | 既存Notion integration。既存値を維持 |
| `NOTION_ACHIEVEMENTS_DATA_SOURCE_ID` | 実績DB。既存値を維持 |
| `NOTION_TITLES_DATA_SOURCE_ID` | 称号DB。既存値を維持 |
| `NOTION_QUESTS_DATA_SOURCE_ID` | クエストDB。既存値を維持 |
| `NOTION_STATUS_DATA_SOURCE_ID` | PLAYERを持つStatus DB。既存値を維持 |
| `NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID` | 確認済みのAdventure Logs data source。preview設定済み、本番未設定 |
| `BLOB_READ_WRITE_TOKEN` | 非公開Blobの接続で自動設定。ブラウザーへ公開しない |
| `PHOTO_UPLOADS_ENABLED` | 保護を確認した環境だけ`true`。#43 / #48 / #49のpreviewブランチに設定、本番は未設定 |
| `CRON_SECRET` | 一時データ掃除専用の機密値。production/preview設定済み |

Adventure Logsの必要プロパティ：Name（title）、Memo/Location/Request ID（rich_text）、Logged At（date）、Log Type（multi_select）、Visibility/Lifecycle（select）、Favorite（checkbox）、Player/Related Achievement（relation）、Media（files）。

Playerは既存Status DBのPLAYERへ、Related Achievementは既存Achievementsへ関連付ける。Active / Private / Photo等の既存選択肢を利用する。既存のNotionレコードやDB構造を勝手に作り替えない。

環境変数変更は次のデプロイから反映される。previewの成功を確認してからproductionへ同じ設定を反映し、対象コミットを確認してデプロイする。

## 読み取り専用で確認する

1. ログアウト状態で、HOME・新規ログ画面・写真APIがVercelの認証に阻まれること。未保護なら`PHOTO_UPLOADS_ENABLED`を有効化しない。
2. 認証済みで`/api/notion-health`が200、`ok: true`、`source: notion`になること。
3. 認証済みで`/api/adventure-logs/health`が200、`ok: true`、`invalidProperties: []`になること。
4. 写真を使う環境では`photoUploadsEnabled`・`stagingConfigured`・`cleanupConfigured`がすべてtrueになること。
5. 本番Notionの既存データが読み取れること。MCP接続で読めても、Web integrationの権限まで確認できたことにはならない。

## ローカル・自動検証

```text
npm ci
npm audit --audit-level=moderate
npm run test:photos --workspace apps/web
npm run typecheck --workspace apps/web
npm run build
```

テストではメモリ内で作ったJPEG/PNG/WebPとモックを使い、Notionに永続テストデータを作らない。既存GitHub Actionsは型とビルドを確認する。写真テストは上記コマンドで別途実行する。依存PRはbaseがmainではないため、現在のworkflowの対象外。mainへbaseを変更した時点で必ずCIを再確認する。

## 公開前の操作確認

- JPEG/PNG/WebP、1枚・5枚、順序維持、個別削除、6枚目、5MiB超、空・偽装画像を確認。
- 未アップロード写真がある間は保存できず、写真を外せば文章だけで保存できる。
- アップロード後に本人の実際の思い出を1件保存し、HOME・一覧・再読み込み後に写真が表示されること。ユーザーの許可なしに永続テストレコードを作らない。
- 写真のみ、写真＋文章＋場所、実績解除後の任意記録、今回は残さない、保存失敗と再試行を確認。
- 写真転送・ページ作成の二重実行を防ぎ、添付失敗でも文章と成立済み実績が残ること。
- 画像読込失敗のフォールバック、期限付きURLの再取得、スマホ幅、主要ページの検索・移動を確認。
- 本番Cronが実行され、転送済み・放置された一時画像が削除されること。通常24〜48時間。ページング再開位置も確認。

## 公開順序と戻し方

1. #47安全性更新 → #43 Upload → #48 Media Attach → #49表示 → 設定文書、の順にレビューする。
2. 各依存先のマージ後にbaseをmainへ変更し、差分とCI・previewを再確認する。Draftのまま依存先を追い越さない。
3. repository規約に従って人間のレビュー・マージを行う。mainへ直接コミットせず、強制pushしない。
4. 全体検証後、本番へ冒険ログ接続先と`PHOTO_UPLOADS_ENABLED=true`を追加し、確認したmainのコミットをデプロイする。ページの公開範囲を広げない。
5. 読み取りの疎通確認を行う。問題があれば写真を無効化し、Vercelで以前の正常デプロイへ戻す。Notionの既存データは削除しない。
6. #34は分離した責務が揃い検証できてから役目を見直す。今回自動クローズしない。

## 困ったとき

- 「準備中」：写真有効化・Blob接続と再デプロイを確認。文章だけで記録できる。
- 「転送結果を確認中」：応答が不明な写真を自動で送り直さないための保護。少し待って同じ画面から再試行。解消しなければ選び直す。
- 文章保存済み・添付失敗：同じ画面から再試行。Notionで保存済みの記録を確認できる。独立して編集されたMediaは上書きしない。
- 画像が表示されない：再読み込みで最新URLを取得。URLを別のNotionプロパティへコピーして固定しない。
- 容量・形式エラー：元画像は変更しない。5MiB以下のJPEG/PNG/WebPを別途選ぶ。無料枠の制約を自動的な課金変更で解消しない。
