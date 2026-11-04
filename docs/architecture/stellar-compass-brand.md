# Life OS ブランドデザイン採用版

Depends on: #59 — B1 NEO SYSTEM Phase 1
Tracks: #60
Blocks: ブランド更新の本番承認

## 採用範囲

ユーザー提供の「Life OS ステラコンパス ブランド設計板」のA2-4 Stellar CompassをSVGで再構成する。4方向のコンパス、分割された円弧、小さな星を基本とし、青・シアン・淡いパープルのグラデーションを使用する。文字ロゴは **Life OS**（小文字のi）。共通ロゴと512pxのPWAアイコンで同じアートワークを使用する。

英数字・ロゴはローカル配信のSora Variable、日本語はNoto Sans JP Variable。Space Groteskの依存と参照を置き換える。日本語本文の読みやすさと既存の動きを抑える設定を維持する。

## トークン

|用途|色|
|---|---|
|背景|#0B1220|
|パネル|#111B2E|
|Primary / Uncommon|#00D9F5|
|Accent / Rare|#A78BFA|
|Common|#BAC8DC|
|Epic|#FFD166|
|Legendary|#FF5C7A|

実績一覧と詳細に同じ六角形フレームを表示する。Tierの文字表示は残し、色だけで情報を伝えない。未設定・未対応のTierは中立色で表示し、Commonとして補完しない。

登録済みDomainのCafe、Photography、Natureにはそれぞれカップ・カメラ・山を使用する。複数該当する場合はDomainの登録順で選択する。それ以外は共通の星とし、モチーフのために分類やデータを変更しない。SVGは隣接する名前とTierを重複して読み上げない装飾とする。

## 維持する境界

ナビゲーションは既存の6つの移動先を維持。冒険ログは本、実績は輪郭のトロフィー、称号は輪郭の王冠とする。スマホでは上部にロゴ、下部に6つのナビを表示する。

Notion Repository、API、保存・解除・検索処理は変更しない。HOMEや実績一覧の全面刷新、実績ツリー、図鑑、新しいページ、解除演出は対象外。画像内の見本データは取り込まない。本番への統合は別途承認が必要。

## 検証

- `npm run typecheck --workspace apps/web`
- `npm run build --workspace apps/web`
- `node --experimental-strip-types --test apps/web/components/brand/badge-policy.test.mjs`
- `npm run test:photos --workspace apps/web`
- VercelプレビューでPC・スマホのロゴ、一覧・詳細のバッジ、ナビゲーション、写真の既存表示を確認する。Notionへの書き込みを伴う保存・実績解除テストは行わない。
