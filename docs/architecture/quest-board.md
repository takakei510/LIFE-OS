# Quest Board / Optional acceptance

## Source of truth

Notion Questsデータソースのみを管理元とする。Webアプリ側にクエスト本文や状態を複製しない。

## Read flow

1. Server Componentが`getLifeOsSnapshot()`を呼ぶ
2. Notion APIからQuestsを取得
3. LIFE OS内部型`Quest`へ変換
4. 画面内でType・Stateを絞り込む（`?state=accepted`は受注中）
5. カードとして表示

## Scope and verified existing schema

2026-11-04のユーザー確認により、受注・取り消しを先行し、完了・報酬連携は別PRに分離する。期限・未達ペナルティ・ストリーク・受注数上限を追加しない。

- Quests Stateはselect: Available / Accepted / Completed / Skipped / Expired。
- LifecycleはActive / Draft / Archived。Player relationは単一PLAYER STATUSのPLAYERを参照。
- Reward XP、Earned XP formula、Completed At、Is Completed formulaとPLAYER STATUSのQuest XP rollupは既存のまま。
- 実績XPとクエストXPは別集計。今回、報酬や条件の重複解釈は決めず、両方を自動解除しない。
- スキーマ更新、レコード作成・移行、XP/Level式の変更なし。

## Boundaries and transitions

UI → Server Action → Application Service → Repository → Notion API。

Repositoryはページ送りで読み取り、Active・単一PLAYER所属だけをDTOへ正規化する。既存Available From / Due Atが設定されている場合だけ受注期間を検証。日付のみの値は日本時間の開始/終了として扱う。新しい期限や自動失効は作らない。Skipped / Expired / 未知状態を挑戦可能へ補完しない。

- `/quests`は検索・種類/状態の絞り込みと詳細リンク。
- `/quests?state=accepted`は受注中タブ。検索と絞り込みは引き続き使用可能。
- `/quests/[id]`は説明・達成条件・既存達成報酬・受注操作。読込失敗は404と区別。
- `Available → Accepted`で受注。`Accepted → Available`で取り消し。
- サーバーでUUID・操作・revision・DB所属・Lifecycle・ゴミ箱・Player・現在状態・Completed Atを再検証。
- 書き込みはState一項目だけ。XP/Completed At/実績/ログ/Playerは変更しない。完了済みは再受注不可。
- 同じ状態への再送は書き込まない。古いrevisionで状態変更が必要なら拒否し再読込を案内。
- Notion APIに条件付き更新/CASはないため、検証と更新の間に他画面/Notionから同時変更された場合の原子的な競合防止は保証しない。このPRにXP加算・不可逆完了処理は含めない。完了連携では別途競合方針を設計する。
- 成功時に一覧・詳細を再検証。失敗時はNotion内部エラーを表示せず、再読込で状態を確認できる。

## Deployment and security

既存の単一利用者向けVercel Authenticationを認証境界として維持する。Server Actionsもその保護対象。共有リンクや公開ドメインでの利用を前提にしない。`QUEST_ACTIONS_ENABLED=true`の環境だけが操作可能。初期値は無効。既存Next.js Server Actionの同一オリジン保護を維持。

今回のプレビューは`feat/quest-acceptance`ブランチだけで有効化。本番変数は変更しない。公開前に対象ドメイン/デプロイの認証保護を再確認する。保護対象外のドメイン追加や複数利用者への展開にはアプリ認証・所有者認可の再設計が必要。

## Verification

`npm run test:quests --workspace apps/web`で遷移/再送/古い画面/不正対象/失敗/期間境界と、偽SDK transportを使った実Repositoryのページ送り・正規化・State限定更新を検証する。テストはネットワーク/Notion書込なし。型チェック、Production build、PC/スマホの実データ読込・検索・詳細導線を確認する。

実際の受注・取り消しは既存レコードの状態を変更するため、ユーザー自身が選んだクエストで行う。確認前に本番完了とは報告しない。

Depends on: None
Blocks: Quest completion / reward integration
