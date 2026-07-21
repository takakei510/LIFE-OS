# 🎮 LIFE OS

> LIFE OSは「何者になるか」を競うゲームではない。  
> 「どれだけ世界に触れたか」を楽しむゲームである。

LIFE OSは、人生を管理するためではなく、実績・称号・クエスト・図鑑などを通して現実世界との接触を楽しむためのゲームシステムです。

## Architecture

- **Notion** — セーブデータと公式仕様書
- **AI Game Master** — 実績判定、提案、ゲーム運営
- **Web App** — プレイヤーが触れるゲーム画面
- **Supabase / PostgreSQL** — 将来の正式データ基盤

## Repository Structure

```text
apps/web/              Next.js Webアプリ
docs/spec/             公式仕様書
docs/architecture/     システム設計
docs/patch-notes/      更新履歴
data/                   エクスポート・初期データ
scripts/                Notion同期・移行スクリプト
supabase/               DBスキーマ・マイグレーション
```

## Version 0 Goal

Notionのデータを読み取り、以下をゲーム画面として表示します。

- PLAYER CARD
- 実績ライブラリ・詳細
- クエスト一覧
- 称号一覧・装備中称号
- XP・レベル
- 実績解除演出

## Development

```bash
npm install
npm run dev
```

Webアプリは `apps/web` で起動します。

## Development Principles

1. 同じ情報は二度管理しない
2. 管理ではなく遊びを優先する
3. 上達より体験を評価する
4. 入力負荷を最小にする
5. 完成ではなく継続的なアップデートを目指す
