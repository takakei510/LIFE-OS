# Life OS 独自アイコン v1 組み込み

Tracks: #64 / Depends on: #63 / Blocks: アイコン更新の本番承認

デザインの正本は[提供SPEC](../design/life-os-icons-v1/SPEC.md)と[manifest](../design/life-os-icons-v1/manifest.json)。原本の28SVGとspriteを`docs/design/life-os-icons-v1`へ保持し、pathを変更せずReact用の属性名に変換したspriteをRootLayoutへ一度だけ配置する。JavaScript・外部参照・画像依存を加えない。

## 表示

- `LifeIcon`: 16/20は-small、24/32は標準symbol。中立色#A8BBD2、外側2px余白、名前とのgap 6px（余白込み8px）。装飾はaria-hidden/focusable=false、単独表示は日本語labelを指定できる。
- `AchievementName`: 表示名とモチーフの唯一の決定箇所を共有。HOME16、一覧20、詳細24。元名は変更せず検索・保存・解除処理へ引き続き元値を渡す。
- `AchievementBadge`: 一覧/HOME最近の解除48、詳細/HOME提案64。外枠2・内枠1/opacity .24、中央32×32（16,16）の標準モチーフ。中央は中立色、枠とTier名だけをTier色にする。
- `TierName`: 既存Tierを表示用に正規化し、星を追加しない。未知/未設定は中立色と「Tier未設定」。検索用optionの値は元Tierを保持する。
- `PlayerRank`: 正式な既存値`🌱 Beginner`または`Beginner`だけを芽＋Beginnerとして表示。その他のランク文字列はそのまま。新しい条件やランクを追加しない。

## 対応表

2026-11-04追加：カテゴリ「🎸 育成」は `life-growth`（重なった輪郭）、「💪 身体」は `life-body`（動く人）を使う。追加原本とサイズ比較は `docs/design/category-icons-v1` に保持。既存Domain対応や保存値は変更しない。

HOMEコレクションの大きなカテゴリ枠も、この2つの完全一致カテゴリだけ同じ標準モチーフへ揃える。共通の中立色の枠を維持し、Tier/ランクの意味は付加しない。他のカテゴリは既存表示を維持する。

RepositoryのmultiSelectで正規化済みの既存Domain識別子を使う。日本語の実績名やカテゴリ名から推測しない。複数Domainは登録順の最初の対応を採用し、未対応はlife-general。

|Domain|モチーフ|
|---|---|
|Music|life-music|
|Cafe|life-cafe|
|Cooking|life-cooking|
|Nature|life-nature|
|Photography|life-photo|
|Reading|life-reading|
|Travel|life-journey|
|Writing|life-creation|
|Research|life-research|
|Communication / Relationship|life-connection|

全件展開の承認を受け、2026-11-04（JST）にNotionを読み取りで確認した実績262件のうち、装飾接頭辞のある111件を`decoration-registry.ts`へ登録した。IDと接頭辞だけを保持し、名前や説明文は複製しない。登録IDと接頭辞が一致する場合のみ画面上で差し替える。本文・メモ・達成条件などの絵文字は処理しない。IDが違う同名実績や接頭辞が変わった実績には適用しない。次の3件は個別のモチーフ指定も維持する。

|実績ID|接頭辞|モチーフ|
|---|---|---|
|3a4391a3-54a9-8166-9b6d-dc2bdde050d0|🎵 |life-music|
|3a4391a3-54a9-815e-a951-e81e874c9b40|🪞 |life-discovery|
|3a4391a3-54a9-81cd-9ad1-e02417134d11|🪟 |life-window|

解除演出も同じ表示部品を使用する。既存ロゴ・ナビSVG、Notionデータ/スキーマ/API/XP/Level計算は維持。デザインボードの見本名は登録しない。既存カテゴリの六角アイコンは分類表示用として維持し、実績のDomainモチーフとは混同しない。

## 検証

全件展開では、既存Category6種類も完全一致の対応表で表示する。option valueとリンクのクエリー値は元値を維持し、ラベルだけを変更する。HOMEのカテゴリ名から絵文字を一律に除去していた正規表現も廃止した。未登録カテゴリはそのまま表示する。

称号27件とクエスト115件の名前には装飾接頭辞がないことを確認したため名前は変更しない。クエスト・ステータスのカテゴリ、冒険ログ種別・写真選択・空表示・エラー表示のアプリ装飾もSVGへ揃える。冒険ログの名前・本文・写真名・説明文・メモは処理しない。関連実績の案内は表示名を使い、hidden inputと保存処理には元名を渡す。

今後追加されたIDや、既存IDでも接頭辞が変わった名前は保持する。将来の追加も対応表へ明示的に登録する。未対応モチーフはlife-general。

`node --experimental-strip-types --test apps/web/components/life-icons/presentation.test.mjs apps/web/components/brand/badge-policy.test.mjs apps/web/app/home/collections.test.mjs`でID＋接頭辞限定、元値保持、Domain順序、未知Tier、Beginner、提供28symbolとpath一致を検証する。既存写真テスト、型チェック、ビルド、VercelプレビューでPC/スマホの小サイズ、一覧/詳細のモチーフとTierの一致、読み上げ重複がないことを確認する。本番は別途承認まで未反映。
