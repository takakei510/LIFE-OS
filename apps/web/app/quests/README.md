# Quest Board

`/quests`はNotionのQuestsデータソースを読み取り、クエストをゲームの掲示板として表示します。

- `type`クエリでQuest Typeを絞り込み
- `state`クエリでAVAILABLE / ACCEPTED / COMPLETEDを絞り込み
- Notion未接続時は空状態を表示
- 書き込みは行わず、Version 0では読み取り専用
