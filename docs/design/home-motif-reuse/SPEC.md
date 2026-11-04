# life-home：既存ナビ形状の流用

デザインレビューで提案された洗濯・机整理の2件に使用する。既存`apps/web/components/ui/neo-icon.tsx`のhomeの2つのpathをそのまま別symbolにし、新しい形状は描き起こしていない。ナビ本体は変更しない。

流用元基準：`2195c5c1f58a8b446dd468c186a5a62b0da88136`。

24単位、線幅1.6、round cap/join、fillなし、currentColor。標準とsmallは同形。16/20はsmall、24以上と六角中央は標準を使用する。実績モチーフとして適用し、新しいランク・Tier・移動先は追加しない。

対応IDは`achievement-motifs.ts`の2件だけ。元の名前・分類・保存値は維持する。
