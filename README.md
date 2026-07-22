# 🎮 LIFE OS

> LIFE OSは「何者になるか」を競うゲームではない。  
> 「どれだけ世界に触れたか」を楽しむゲームである。

LIFE OSは、人生を管理するためではなく、実績・称号・クエスト・図鑑などを通して現実世界との接触を楽しむためのゲームシステムです。

## Play

**Production:** https://life-os-web-m3ds.vercel.app

現在のリリース：**v0.3.0**

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

## Version 0.3 — Released

Notionの記録を、検索・振り返り・探索提案まで含むゲーム画面として利用できます。

- 実績ライブラリ・詳細・横断検索
- クエスト検索・種類／状態フィルター
- 称号検索・Tier／取得状態フィルター
- Statusのカテゴリ別実績進捗
- 最近の冒険ログ
- 今日の探索候補
- PLAYER CARD、XP、レベル
- 実績解除演出
- スマホ固定下部ナビゲーション
- PWAとしてホーム画面へ追加
- ローディング表示・エラー復旧画面
- Hidden実績と未取得称号の秘密表示

詳細は [`docs/patch-notes/v0.3.0.md`](docs/patch-notes/v0.3.0.md) を参照してください。

## Adventure Logs — In development

- Notionの独立したAdventure Logs DBを管理元にする
- HOMEと専用一覧から思い出を閲覧する
- Memo・LocationによるテキストログをWebから任意作成する
- ログ作成にXPを付与しない
- 作成時はPrivate / Activeで保存する
- requestIdで二重送信を防ぐ
- 写真・音声アップロードは後続バージョンで追加する

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
NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID
```

`NOTION_ADVENTURE_LOGS_DATA_SOURCE_ID`はAdventure Logs機能を有効にする任意設定です。未設定でも既存画面は動作します。

秘密情報はGitHubへ保存せず、Vercelまたはローカルの環境変数として管理します。

## Development Principles

1. 同じ情報は二度管理しない
2. 管理ではなく遊びを優先する
3. 上達より体験を評価する
4. 入力負荷を最小にする
5. 完成ではなく継続的なアップデートを目指す
