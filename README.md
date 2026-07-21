# 🎮 LIFE OS

> LIFE OSは「何者になるか」を競うゲームではない。  
> 「どれだけ世界に触れたか」を楽しむゲームである。

LIFE OSは、人生を管理するためではなく、実績・称号・クエスト・図鑑などを通して現実世界との接触を楽しむためのゲームシステムです。

## Play

**Production:** https://life-os-web-m3ds.vercel.app

現在のリリース：**v0.2.0**

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

## Version 0.2 — Released

Notionの記録を、スマホから遊びやすいゲーム画面として利用できます。

- PLAYER CARD
- 実績ライブラリ・詳細・検索
- クエスト一覧
- 称号一覧・装備中称号
- Status
- XP・レベル
- 実績解除演出
- 最近解除した実績
- スマホ固定下部ナビゲーション
- 日本語UI
- PWAとしてホーム画面へ追加
- ローディング表示
- エラー復旧画面
- 通常実績の探索候補表示
- Hidden実績の秘密表示

詳細は [`docs/patch-notes/v0.2.0.md`](docs/patch-notes/v0.2.0.md) を参照してください。

## Development

```bash
npm install
npm run dev
```

Webアプリは `apps/web` で起動します。

## Environment Variables

```text
NOTION_TOKEN
NOTION_ACHIEVEMENTS_DATA_SOURCE_ID
NOTION_TITLES_DATA_SOURCE_ID
NOTION_QUESTS_DATA_SOURCE_ID
NOTION_STATUS_DATA_SOURCE_ID
```

秘密情報はGitHubへ保存せず、Vercelまたはローカルの環境変数として管理します。

## Development Principles

1. 同じ情報は二度管理しない
2. 管理ではなく遊びを優先する
3. 上達より体験を評価する
4. 入力負荷を最小にする
5. 完成ではなく継続的なアップデートを目指す
