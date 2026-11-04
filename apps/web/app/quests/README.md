# Quest Board

`/quests`はNotionのQuestsデータソースを読み取り、クエストをゲームの掲示板として表示します。

- 画面内で種類・状態を絞り込み
- `/quests?state=accepted`で受注中を表示
- Notion未接続時は空状態を表示
- `/quests/[id]`で詳細と任意の受注・取り消し
- `QUEST_ACTIONS_ENABLED=true`かつ既存のデプロイ認証保護下で利用
- Stateのみ更新。完了・実績解除・XP加算は行わない

詳細: `docs/architecture/quest-board.md`
