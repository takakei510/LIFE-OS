# LIFE OS Development Guide

この文書は、LIFE OSを長期的に開発するための共通ルールを定める。

## 1. Product Philosophy

LIFE OSはTODO管理・習慣管理・生産性管理のためのシステムではない。
現実の生活をゲームとして楽しみ、新しい世界へ触れるきっかけを増やす。

> LIFE OSは「何者になるか」を競うゲームではない。
> 「どれだけ世界に触れたか」を楽しむゲームである。

新機能は次の問いで評価する。

> これを開いたとき、少し現実で何かをしてみたくなるか。

TODO管理、習慣管理、ストリーク、未達成へのペナルティ、人間の能力評価、毎日の入力強制へ近づく設計は避ける。

## 2. Single Source of Truth

同じ情報は二度管理しない。

- Achievements：Achievements DB
- Titles：Titles DB
- Quests：Quests DB
- Player Status：Status DB
- Adventure Logs：Adventure Logs DB
- HOMEや一覧：表示レイヤー

Notionを唯一の管理元とし、Webアプリは表示・操作レイヤーとして扱う。

## 3. Architecture

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

UIは表示・入力・操作状態を担当し、Notion APIやDBスキーマを直接扱わない。
Server Actionは通常の状態変更、Route Handlerは写真・音声などのファイル処理に使う。
Application Serviceは業務ルール、RepositoryはNotion API通信だけを担当する。

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

## 5. Naming Conventions

関数は動詞から始める。Booleanは状態が分かる名前にする。型は対象と役割を明示する。
Notion上の正式なプロパティ名はMapper・Repositoryでのみ扱い、アプリ内部ではcamelCaseへ変換する。

## 6. Git Workflow

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

ブランチ名は `feat/`、`fix/`、`docs/`、`refactor/` を基本とし、Issue番号がある場合は `feat/35-photo-picker` のようにする。
コミットはConventional Commitsに近い形式を使う。

## 7. Issue Rules

1 Issue = 1目的。
Issue本文には、概要、背景・目的、実装範囲、対象外、完了条件、確認項目を書く。
大きすぎるIssueは実装順に分割する。

## 8. Pull Request Rules

原則として1 PR = 1機能または1つの明確な変更目的。
PR本文には、概要、変更内容、動作確認、安全性・影響範囲、対象外、関連Issueを書く。

### Dependency notation

依存関係があるPRは、本文へ次を明記する。

```text
Depends on: #<先にマージするPR番号> または None
Blocks: #<このPRを待つPR番号> または None
```

依存PRが未マージの間はDraftを維持する。依存先がマージされたらbaseと差分を再確認し、CI成功後にReady for Reviewへ進める。

分離すべき変更：

- 機能追加と大規模リファクタ
- DBスキーマ変更とUI刷新
- 実績解除処理とファイルアップロード処理

Merge条件：

- TypeScript型チェック成功
- Production build成功
- 主要導線の手動確認
- Notion既存データを意図せず変更していない
- 秘密情報をコミットしていない

## 9. Notion Safety Rules

書き込み前に対象DB、Page IDまたはLIFE OS ID、Lifecycle、現在状態、Relation先、Player、重複・再送を確認する。
既存レコードは明示的な目的がない限り変更しない。削除より`Lifecycle = Archived`を優先する。
ブラウザからNotion Page IDを自由入力させず、サーバー側で解決・検証する。

取得時点で除外できる無効データはRepositoryまたはSnapshot境界で除外し、表示層へ不要な状態を持ち込まない。

## 10. Transaction Boundaries

実績解除・クエスト完了とAdventure Log作成は別トランザクションにする。
ログ保存に失敗しても、実績解除やクエスト完了を巻き戻さない。

## 11. Validation and Idempotency

入力値はサーバー側でも検証する。
文字数、MIME Type、ファイルサイズ、ファイル数、日時、Relation対象の状態を確認する。
新規ページ作成では`requestId`などを利用し、二重送信を防ぐ。

## 12. Privacy

Adventure Logsの初期値：

```text
Visibility = Private
Lifecycle = Active
Favorite = false
Player = PLAYER
```

位置情報はGPS必須にせず自由入力を基本とする。写真・音声には個人情報が含まれる可能性をUIで案内する。

## 13. AI First Development

人とAIが継続的に共同開発できる構造を保つ。
責務を明確に分離し、曖昧な命名を避け、小さなIssue・PRを基本とする。
設計変更は先に文書化し、実装済みと未実装を明確に区別する。
実際にGitHubへ反映された変更だけを完了と報告する。
AIが生成したコードもCIと動作確認を通す。
秘密情報・破壊的変更・データ移行は人間が最終確認する。

## 14. Product Quality Rules

- スマホで少ない操作数
- 入力を強制しない
- 写真・音声・Memo・Locationは任意
- ログ作成にXPを付与しない
- 記録しない選択を常に用意する
- 既存機能を壊さない
- TypeScriptエラーを残さない
- Production buildが通る状態を維持する
