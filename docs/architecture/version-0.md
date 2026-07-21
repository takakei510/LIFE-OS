# Version 0 Architecture

## Goal

Notionを読み取り専用のセーブデータとして利用し、LIFE OSの主要情報をWeb画面に表示する。

```text
Notion Databases
      ↓
Next.js Server Components / Route Handlers
      ↓
LIFE OS Web UI
```

## Data Sources

- Achievements
- Titles
- Quests
- Status

## Rules

- Notionトークンをブラウザへ公開しない
- Notionへの書き込みはVersion 0の対象外
- 表示用の派生値はWeb側で計算してもよいが、ゲームデータの管理元はNotionとする
- UIコンポーネントはNotion固有のレスポンス型へ直接依存させない

## Initial Screens

1. Home / Player Card
2. Achievements Library
3. Achievement Detail
4. Quests
5. Titles

## Completion Criteria

- `npm install` と `npm run dev` で起動する
- 環境変数未設定時も安全な案内画面を表示する
- 4つのNotionデータソースをサーバー側で取得できる
- モバイル幅で主要画面を操作できる
