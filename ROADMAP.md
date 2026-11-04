# 🎮 LIFE OS Roadmap

LIFE OSは「何者になるか」を競うゲームではない。
「どれだけ世界に触れたか」を楽しむゲームである。

このファイルは、LIFE OSで今後何を作るかを管理する。
実装方法や開発規約は `docs/DEVELOPMENT.md` を参照する。

## Current Phase

### Expansion 0 — 写真対応と日常利用MVP（2026-11-02再開）

- 最新公開基準（2026-11-04）：`370936e`。#59/#61/#63/#65のデザイン更新、#67のクエスト受注を統合済み。`14e8a68`は再開時の調査基準。
- #39〜#42：統合済み。#34は分離元としてDraft維持
- #47：Web依存ライブラリの安全性更新（統合済み）
- #43：元画像Upload API・非公開一時搬送（統合済み）
- #48：Media添付・日本時間の正規化（統合済み、CI #148成功）
- #49：HOME・一覧写真表示（統合済み、CI #150成功）
- 初期設定・検証手順：`docs/MVP_SETUP.md`

Draftの実装を本番完了とは数えない。公開前に接続・認証・保存から再表示までを検証する。Notion無料プランと元画像保持の選択により、今回のMVPは1枚5MiB以下へ変更した。Google フォトからの選択は将来の独立した連携候補とし、今回の公開条件には追加しない。

### Sprint 1 — 開発基盤整備

目的：AIと人が長期的に共同開発できる基盤を整える。

- [x] `ROADMAP.md` を追加
- [x] `docs/DEVELOPMENT.md` を追加
- [x] GitHub Issue Templateを追加
- [x] Pull Request Templateを追加
- [x] 写真アップロード機能をIssueへ分割
- [x] Issue運用を開始

## Version Roadmap

### v0.3.0 — 読み取り・表示基盤

- [x] 実績ライブラリ
- [x] 称号コレクション
- [x] クエストボード
- [x] Status表示
- [x] 今日の探索候補
- [x] カテゴリ別進捗
- [x] 検索・絞り込み
- [x] PWA対応

### v0.4.0 — Webから遊ぶための書き込み

- [x] 実績解除
- [x] クエスト受注・取り消し（#67、本番公開済み）
- [ ] クエスト完了
- [ ] 称号装備・解除

### v0.4.1 — Adventure Logs 読み取り

- [x] Adventure Logs DB
- [x] HOME「最近の冒険」
- [x] Adventure Logs一覧
- [x] モバイルナビゲーション

### v0.4.2 — Adventure Logs テキスト作成

- [x] Memo
- [x] Location
- [x] Logged At
- [x] Private / Active初期値
- [x] requestIdによる二重送信対策
- [x] 実績解除後の任意記録導線
- [x] Related Achievement

### v0.4.3 — Adventure Logs 写真対応

- [x] 写真選択UI（#42）
- [x] 最大5枚（#42）
- [x] JPEG / PNG / WebP（#42）
- [x] 1ファイル20MB以下の選択検証（#42。無料Notion用MVPは#43で5MiB以下へ変更）
- [x] プレビューと削除（#42）
- [x] 専用Upload Route Handler
- [x] Notion File Upload API
- [x] Adventure LogsのMediaへ保存
- [x] HOME・一覧で写真表示

関連Issue：#35、#36、#37、#38

### v0.4.4 — Adventure Logs 音声対応

- [ ] 音声ファイル選択
- [ ] MIME・容量検証
- [ ] Notionへの保存
- [ ] 再生UI

### v0.5.0 — Adventure Logs 拡張

- [ ] ブラウザ上での直接録音
- [ ] 自由ログ
- [ ] Favorite
- [ ] 編集・Archive
- [ ] Story連携

## Next Major Theme

### Achievement Progress — Progress Achievements

Adventure Logs完成後に正式設計する大型アップデート候補。
実績を一度だけ解除する体験に加え、複数回の現実体験を通して少しずつ育つ実績を検討する。

設計時の条件：

- 上達度や能力を評価しない
- ストリークや毎日の入力を要求しない
- 未進行・中断へペナルティを与えない
- 進捗は現実で触れた回数や異なる体験の蓄積として扱う
- 通常実績との役割分担を明確にする

## Future

### Quest acceptance（本番公開済み）

- [x] 詳細画面・受注中の絞り込み・Available/Acceptedの切り替え
- [x] State限定更新、所有者/Lifecycle/再送/古い画面のサーバー検証
- [x] 本番承認・統合・一覧の受注ボタンと115件の表示確認（#67）
- [ ] ユーザーが選んだクエストでの受注・取り消し実操作確認
- [x] 報酬方針を確認：クエストXPと実績XPは別報酬、実績は手動解除
- [ ] クエスト完了・既存報酬反映を検証中（#68、本番未反映）

### Collections

- カフェ図鑑
- 映画図鑑
- アニメ図鑑
- 読書図鑑
- ゲーム図鑑
- ボードゲーム図鑑
- 旅行図鑑

### Skill Tree

- 育成要素
- 派生スキル
- 探索と育成の明確な分離

### Story

- Adventure Logsから物語を作る
- 複数の体験を一つの旅路として振り返る

### Experimental

- 隠し実績
- 季節イベント
- 人生マップ
- ランダムイベント
- AIによる実績・クエスト提案
- 今日のおすすめ

## Prioritization Rule

新機能は、次の問いにYesと答えられる場合に優先する。

> これを開いたとき、少し現実で何かをしてみたくなるか。

TODO管理、習慣管理、生産性管理へ近づく機能は慎重に扱う。
