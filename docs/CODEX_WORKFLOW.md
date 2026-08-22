# LIFE OS Codex Development Workflow

## 目的

LIFE OSのProducerとDeveloper間で文章をコピペせず、GitHub Issueを開発指示のSingle Source of Truthとして使う。

OpenAI APIをGitHub Actionsから直接呼び出す方式は使用しない。DeveloperはChatGPT Plusに含まれるCodexを利用する。

## 役割

- Producer: ChatGPT上で仕様を整理し、GitHub Issueを作成・更新する
- GitHub Issue: 実装要求の唯一の正本
- `ai-ready`: Producer側の仕様確認が完了したことを示すハンドオフ印
- Codex: DeveloperとしてRepositoryを調査・編集・テストする
- Pull Request: DeveloperからProducerへの実装報告
- CI: typecheck / buildなどの自動確認

## 標準フロー

1. Producerと仕様を相談する
2. ProducerがGitHub Issueを作成する
3. 仕様が実装可能な状態になったら`ai-ready`を付ける
4. CodexでLIFE-OS Repositoryを開く
5. 対象Issue番号を指定して実装を依頼する
6. Codexは`.github/agents/developer.md`、`docs/DEVELOPMENT.md`、`ROADMAP.md`を読んでから実装する
7. Codexがtypecheck / buildを実行する
8. CodexがDraft PRを作成する
9. Producerまたは人間がPRをレビューする
10. 修正が必要ならCodexへPRレビュー内容を渡して修正する
11. 承認後に人間がMergeする

## Codexへの最小依頼

次のように、Issue本文をコピーせずIssue番号だけを起点にする。

```text
LIFE-OSのGitHub Issue #<番号>を実装してください。
.github/agents/developer.md と docs/DEVELOPMENT.md を守り、
完了後はDraft PRを作成してください。
```

Codex側でIssue本文を直接参照できない環境では、Issue URLを渡すか、IssueをRepository内の実装仕様へ同期する運用を検討する。Issue本文そのものを別の管理場所へ複製しない。

## 安全ルール

- mainへ直接pushしない
- 自動Mergeしない
- 1 Issue = 1目的
- 1 PR = 1機能
- Issue対象外を実装しない
- 既存Notionデータの破壊的変更を行わない
- API key / token / secretをRepositoryへ保存しない
- `.github/workflows/` と `.github/agents/` は通常の機能Issueから変更しない

## 課金方針

AI Developer用途でOpenAI API keyをGitHub Actionsから使用しない。ChatGPT契約に含まれるCodex利用枠を優先する。
