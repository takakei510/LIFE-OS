# Quest Board Architecture

## Source of truth

Notion Questsデータソースのみを管理元とする。Webアプリ側にクエスト本文や状態を複製しない。

## Read flow

1. Server Componentが`getLifeOsSnapshot()`を呼ぶ
2. Notion APIからQuestsを取得
3. LIFE OS内部型`Quest`へ変換
4. URLクエリに応じてType・Stateを絞り込む
5. カードとして表示

## Version 0 constraints

- 読み取り専用
- クエストの受注・完了操作はNotionで行う
- API失敗時は空状態へフォールバック
