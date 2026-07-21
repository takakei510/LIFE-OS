# Vercel Deployment

LIFE OS Version 0をGitHubからVercelへ公開する手順です。

## 1. GitHubリポジトリをImport

Vercelで新しいProjectを作成し、`takakei510/LIFE-OS` をImportします。

Project Settingsは次の値を使用します。

- Framework Preset: Next.js
- Root Directory: repository root
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: 自動検出
- Production Branch: `main`

`vercel.json` に同じ設定を保存しているため、通常は自動検出されます。

## 2. Environment Variables

以下の5項目をVercelのEnvironment Variablesへ登録します。

```text
NOTION_TOKEN
NOTION_ACHIEVEMENTS_DATA_SOURCE_ID
NOTION_TITLES_DATA_SOURCE_ID
NOTION_QUESTS_DATA_SOURCE_ID
NOTION_STATUS_DATA_SOURCE_ID
```

適用先は、最初は次の両方を推奨します。

- Production
- Preview

`NOTION_TOKEN` はサーバー側だけで使用します。`NEXT_PUBLIC_` を付けないでください。GitHubのファイル、Issue、Pull Request、ログへ実値を貼らないでください。

## 3. Notion側の共有

Notion Integrationから、次のデータベースを読み取れる状態にします。

- Achievements
- Titles
- Quests
- PLAYER STATUS

データソースIDが正しくても、Integrationへページが共有されていない場合は取得できません。

## 4. Deploy

環境変数を登録した後にDeployを実行します。以後、`main`への更新はProductionへ、Pull RequestはPreview Deploymentへ反映されます。

## 5. 公開後の確認

次の順番で確認します。

1. `/api/notion-health` が成功状態を返す
2. HOMEのバッジが `NOTION SYNC` になる
3. `/achievements` にNotionの実績が表示される
4. `/quests` と `/titles` が開ける
5. `/status` のXPと件数が表示される
6. 新しい実績をNotionで解除した後、HOMEで解除演出が出る

## トラブルシューティング

### DEMO MODEになる

- 環境変数名のスペルを確認する
- Vercelで環境変数追加後に再デプロイする
- Notion Integrationへ対象DBを共有する
- Data Source IDにページURL全体ではなくIDを設定する

### Buildは成功するがNotionデータが出ない

Build時にNotionへ接続できなくてもアプリはフォールバック表示で起動します。`/api/notion-health` とVercel Function Logsを確認します。

### 秘密情報を誤ってGitHubへ貼った

すぐにNotion Integration Tokenを再発行し、Vercelの値を更新してください。削除だけではGit履歴に残る可能性があります。
