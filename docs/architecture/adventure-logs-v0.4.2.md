# Adventure Logs v0.4.2

## Scope

Memo and Locationを使ったテキスト冒険ログ作成。

## Rules

- 実績解除・クエスト完了とログ作成を別処理にする。
- 完全に空のログは作成しない。
- Lifecycleは常にActive。
- Visibilityは常にPrivate。
- Favoriteは常にfalse。
- Log Typeはサーバー側で自動判定する。
- requestIdを必須にし、同一送信による二重作成を防止する。
- ログ作成にXPを付与しない。
- Mediaアップロードは対象外。

## Implemented flow

1. `/adventure-logs/new`を開く。
2. タイトル・Memo・Locationのいずれかを入力する。
3. Server Actionで入力を受け取る。
4. サーバー側で文字数・空入力・日時・requestIdを検証する。
5. Request IDが既存ログに存在する場合は、そのログを返す。
6. PLAYERレコードをStatus DBから解決する。
7. Notion Adventure Logs DBへPrivate / Activeで作成する。
8. HOMEとAdventure Logs一覧を再検証する。

## Limits

- Name: 120文字
- Memo: 2000文字
- Location: 200文字
- 写真・音声・動画: 未対応

## Later integration

実績解除・クエスト完了フローが完成した後、同じフォームへ対象IDと達成日時をサーバー側から渡し、Relationを安全に設定する。
