# 🎮 LIFE OS Roadmap

LIFE OSは「何者になるか」を競うゲームではない。
「どれだけ世界に触れたか」を楽しむゲームである。

このファイルは、LIFE OSで今後何を作るかを管理する。
実装方法や開発規約は `docs/DEVELOPMENT.md` を参照する。

## Current Phase

### Sprint 1 — 開発基盤整備

目的：AIと人が長期的に共同開発できる基盤を整える。

- [x] `ROADMAP.md` を追加
- [x] `docs/DEVELOPMENT.md` を追加
- [ ] GitHub Issue Templateを追加
- [ ] Pull Request Templateを追加
- [ ] 写真アップロード機能をIssueへ分割
- [ ] Issue運用を開始

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
- [ ] クエスト受注
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

- [ ] 写真選択UI
- [ ] 最大5枚
- [ ] JPEG / PNG / WebP
- [ ] 1ファイル20MB以下
- [ ] プレビューと削除
- [ ] 専用Upload Route Handler
- [ ] Notion File Upload API
- [ ] Adventure LogsのMediaへ保存
- [ ] HOME・一覧で写真表示

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

## Future

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
