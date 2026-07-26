# LIFE OS Development Guide

この文書は、LIFE OSを長期的に開発するための共通ルールを定める。

## 1. Product Philosophy

LIFE OSはTODO管理・習慣管理・生産性管理のためのシステムではない。
現実の生活をゲームとして楽しみ、新しい世界へ触れるきっかけを増やす。

最重要の世界観：

> LIFE OSは「何者になるか」を競うゲームではない。
> 「どれだけ世界に触れたか」を楽しむゲームである。

### 開発判断の基準

新機能は次の問いで評価する。

> これを開いたとき、少し現実で何かをしてみたくなるか。

次に近づく設計は避ける。

- TODO管理
- 習慣管理
- ストリーク
- 未達成へのペナルティ
- 人間の能力評価
- 毎日の入力強制

## 2. Single Source of Truth

同じ情報は二度管理しない。

- Achievements：Achievements DB
- Titles：Titles DB
- Quests：Quests DB
- Player Status：Status DB
- Adventure Logs：Adventure Logs DB
- HOMEや一覧：表示レイヤー

Notionを唯一の管理元とし、Webアプリは表示・操作レイヤーとして扱う。
Web専用の一時状態を除き、同じ永続データを複数箇所へ保存しない。

## 3. Architecture

基本的な依存方向：

```text
UI / Page / Component
        ↓
Server Action / Route Handler
        ↓
Application Service
        ↓
Repository
        ↓
Notion API
```

### UI / Page / Component

担当：

- 表示
- 入力
- ユーザー操作
- ローディング・成功・失敗状態

担当しない：

- Notion APIの直接呼び出し
- DBスキーマの知識
- 重要な業務ルールの判定

### Server Action

通常の状態変更に使用する。

例：

- 実績解除
- クエスト受注・完了
- 称号装備
- テキスト冒険ログ作成

役割：

- FormDataの受け取り
- Application Serviceの呼び出し
- `revalidatePath`など表示更新

### Route Handler

ファイルアップロードなど、Server Actionと分離した方が安全な処理に使用する。

例：

- 写真アップロード
- 音声アップロード

ファイル本体を、通常の実績解除用Server Actionへ混在させない。

### Application Service

LIFE OSの業務ルールを実装する。

例：

- 未解除実績だけを解除可能にする
- ログ保存失敗時に実績解除を巻き戻さない
- Log Typeを入力内容から自動決定する
- Adventure Log名を自動生成する

### Repository

Notion APIとの通信だけを担当する。

例：

- ページ取得
- ページ作成
- プロパティ更新
- Relation設定
- requestId検索

UI文言やゲームルールをRepositoryへ入れない。

## 4. Directory Responsibilities

```text
apps/web/app/
  actions/                Server Actions
  api/                    Route Handlers
  achievements/           実績画面
  quests/                 クエスト画面
  titles/                 称号画面
  status/                 Status画面
  adventure-logs/         Adventure Logs画面

apps/web/lib/
  life-os/                Application Service・validation・機能固有型
  notion/
    repositories/         Notion読み書き
    properties.ts         Notion property mapper
    snapshot.ts           読み取りSnapshot
  env.ts                  サーバー環境変数

docs/
  architecture/           機能別設計
  patch-notes/            リリース記録
  DEVELOPMENT.md          開発規約

ROADMAP.md                 今後何を作るか
```

新しいディレクトリを作る前に、既存の責務へ置けないか確認する。

## 5. Naming Conventions

### Function

動詞から始める。

```text
createAdventureLog
unlockAchievement
findAdventureLogByRequestId
validateCreateAdventureLogInput
```

### Boolean

状態が分かる名前にする。

```text
isUnlocked
isArchived
hasMedia
canCreateLog
```

### Type

対象と役割を明示する。

```text
AdventureLog
CreateAdventureLogInput
CreateAdventureLogResult
AchievementUnlockResult
```

### Notion Property

Notion上の正式なプロパティ名をMapper・Repositoryでのみ扱う。
アプリ内部ではcamelCaseへ変換する。

```text
"Logged At" → loggedAt
"Log Type" → logTypes
"Related Achievement" → relatedAchievementIds
```

## 6. Git Workflow

基本フロー：

```text
Issue
↓
Branch
↓
Implementation
↓
Pull Request
↓
CI / Review
↓
Merge
↓
Issue Close
```

### Branch Name

```text
feat/<feature-name>
fix/<bug-name>
docs/<document-name>
refactor/<target-name>
```

Issue番号がある場合：

```text
feat/35-photo-picker
```

### Commit Message

Conventional Commitsに近い形式を使う。

```text
feat: add Adventure Log photo picker
fix: prevent duplicate Adventure Log creation
docs: add LIFE OS development guide
refactor: separate Notion upload repository
```

## 7. Issue Rules

1 Issue = 1目的。

Issue本文には最低限、次を書く。

- 概要
- 背景・目的
- 実装範囲
- 対象外
- 完了条件
- 確認項目

大きすぎるIssueは、実装順に分割する。

例：写真対応

1. 写真選択UI
2. Upload Route Handler
3. Notion File Upload API
4. Media保存
5. 写真表示

## 8. Pull Request Rules

原則として1PR = 1機能または1つの明確な変更目的。

PR本文には次を書く。

- 概要
- 変更内容
- 動作確認
- 安全性・影響範囲
- 対象外
- 関連Issue

### 分離すべき変更

- 機能追加と大規模リファクタ
- DBスキーマ変更とUI刷新
- 実績解除処理とファイルアップロード処理

### Merge条件

- TypeScript型チェック成功
- Production build成功
- 主要導線の手動確認
- Notion既存データを意図せず変更していない
- 秘密情報をコミットしていない

## 9. Notion Safety Rules

書き込み前に確認する。

- 対象DB
- Page IDまたはLIFE OS ID
- Lifecycle
- 現在状態
- Relation先
- Player = PLAYER
- 重複・再送

既存レコードは、明示的な目的がない限り変更しない。
削除より`Lifecycle = Archived`を優先する。

ブラウザからNotion Page IDを自由入力させず、LIFE OS IDなどを受け取り、サーバー側で解決・検証する。

## 10. Transaction Boundaries

独立した意味を持つ処理は分ける。

Adventure Logsの例：

```text
Transaction A
実績解除 / クエスト完了

Transaction B
Adventure Log作成
```

Transaction Bが失敗してもTransaction Aを巻き戻さない。

ユーザー表示例：

> 実績は解除されました。
> 思い出の保存だけ完了できませんでした。

## 11. Validation and Idempotency

入力値は必ずサーバー側でも検証する。

- 文字数
- MIME Type
- ファイルサイズ
- ファイル数
- 日時
- Relation対象の状態

新規ページ作成処理では`requestId`などを利用し、二重送信で同じデータを複数作成しない。

## 12. Privacy

Adventure Logsの初期値：

```text
Visibility = Private
Lifecycle = Active
Favorite = false
Player = PLAYER
```

Privateは本人のLIFE OS内では表示してよいが、外部共有対象にはしない。

位置情報はGPS必須にせず、自由入力を基本とする。
写真・音声には個人情報が含まれる可能性をUIで案内する。

## 13. AI First Development

LIFE OSは、人とAIが継続的に共同開発することを前提とする。
AIが理解しやすく、実装・レビューしやすい構造を保つことを設計品質の一部とする。

そのため、次を守る。

- 責務を明確に分離する
- 曖昧な命名を避ける
- 小さなIssue・PRを基本とする
- 設計変更は先に文書化する
- 実装済みと未実装を明確に区別する
- 実際にGitHubへ反映された変更だけを完了と報告する
- AIが生成したコードもCIと動作確認を通す
- 秘密情報・破壊的変更・データ移行は人間が最終確認する

## 14. Product Quality Rules

次を満たすことを重視する。

- スマホで少ない操作数
- 入力を強制しない
- 「今回は残さない」を自然に選べる
- 失敗時に達成済み状態を失わない
- HOMEを情報過多にしない
- ゲームらしいが、現実逃避にはしない

## 15. Release Policy

機能は段階的にリリースする。

例：Adventure Logs

```text
v0.4.1 読み取り
v0.4.2 テキスト作成
v0.4.3 写真
v0.4.4 音声
v0.5.x 直接録音・Story連携
```

大きな機能を一度に完成させるより、独立して確認できる単位でリリースする。

## 16. Definition of Done

機能は次を満たしたとき完了とする。

- 目的が実装されている
- 対象外が混入していない
- CIが成功している
- スマホを含む主要画面で確認できる
- Notionの管理元ルールを守っている
- エラー時の挙動が定義されている
- 必要な設計書・ロードマップ・パッチノートが更新されている
