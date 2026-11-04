# クエスト完了・既存報酬の反映

## 承認された方針（2026-11-04）

クエストと実績のXPは既存どおり別報酬。実績解除は本人判断の手動操作。Notionを単一情報源に保ち、Reward XP・条件・Formula・Rollup・スキーマを変更しない。

## 実装範囲

- 一覧/詳細で受注中の「達成を記録する」→条件確認→本人判断チェック→確定。
- `Accepted → Completed`と`Completed At`を同じNotion pages.updateで更新する。
- XPを加算するAPIやローカル累積値は作らない。既存Earned XP → PLAYERのQuest XP → Total XP/Levelを再取得して表示する。
- 完了済みの再送はNotionを読むだけ。日時を書き換えない。Completed Atだけが付いた不整合状態、未受注/Skipped/Expired/未知状態、条件未設定、不正報酬、古いrevisionは拒否。
- 受注後に既存Due Atを過ぎても本人判断で完了できる。新しい期限・自動失効・ペナルティは作らない。
- Repeatableは変更しない。この版では1レコードにつき一度だけ完了できる。再受注/繰り返し報酬は別設計。
- 成功時に一覧・詳細・HOME・Statusを再検証。Rollupは遅延する場合があるため「集計を更新する」を用意し、クライアントで報酬を足して補わない。
- Statusは既存の実績XP/クエストXP内訳を表示。詳細に関連実績リンクを表示するが、Hidden未解除を漏らさず、クエスト完了だけで実績を解除しない。関連実績の達成条件が異なることを案内。
- ログ自動作成・新しいNotionテスト記録・本番反映は対象外。

## 操作の調整と再送

UI → Server Action → Application Service → Repositoryを維持。入力形式と単一PLAYER/Lifecycle/所属データソース/ゴミ箱/現在状態をサーバーで検証。

NotionにCASがないため、既存の非公開Blobに`life-os-quest-operations/<dataSourceId>/<pageId>.json`を条件付き新規作成する。受注・取消・完了のすべてで同じキーを使い、取得後にNotionを再読込して検証する。previewとproductionは同じNotionを操作するためキーを環境別に分割しない。

- 同時操作は一つだけが先へ進む。競合した側は再読込を案内。
- 書込前の読込/検証失敗ならロックを解放。
- 書込応答を確認できたらETag指定でロックを解放。解放だけ失敗しても完了を巻き戻さない。
- 書込開始後のタイムアウト/不明な応答はロックを残す。時間経過で自動再送・自動解放しない。
- Notionが既にCompletedなら、応答紛失や解放失敗があっても再送を読取だけで解決。
- ロックは一時的な操作調整であり、クエスト/XPの別管理先ではない。本文/報酬/Playerを保存しない。写真の自動清掃対象にも含めない。

保証はこの版のWeb操作同士に限る。Notion手動変更・旧デプロイの操作はロックを使わない。公開時は古い受注画面を再読み込みして使用する。Notion自体への原子的な比較更新は保証しない。

### 不明な応答からの復旧

自動でロックを削除しない。運用担当者が対象PageのState/Completed At/最終更新日時とVercel実行ログを照合し、処理が実行中でないことを確認する。Completedなら再加算/再更新不要。未完了ならユーザーへ説明し、ロックをETag指定で解放して最新画面から操作し直す。Notionの状態やXPを無断で書き換えない。

## 公開設定

既存Vercel Authenticationを維持。`QUEST_ACTIONS_ENABLED=true`に加え完了は`QUEST_COMPLETION_ENABLED=true`が必要。既存`BLOB_READ_WRITE_TOKEN`を使う。新規ストア/有料連携なし。previewのみ有効化し本番は別承認。未設定/ストレージ障害は書込を止める。

## 検証と未確認

実Service/Repository/Actionのテストで確認・再送・並行・古い状態・所属・部分失敗・State+Completed At限定更新を検証。永続テスト記録は作らない。実環境の完了→報酬再表示はユーザーが残したい体験で実施する。

Depends on: #67 (merged)
Blocks: Quest completion production approval
