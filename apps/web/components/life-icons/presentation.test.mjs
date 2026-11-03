import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// Resolve the extensionless production import for the Node TS test runner.
import ts from "typescript";
const source = readFileSync(new URL("./presentation.ts", import.meta.url), "utf8")
  .replace('import { badgeTier } from "../brand/badge-policy";', `import { badgeTier } from "${new URL("../brand/badge-policy.ts", import.meta.url).href}";`)
  .replace('from "./decoration-registry"', `from "${new URL("./decoration-registry.ts", import.meta.url).href}"`);
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { domainMotif, achievementPresentation, tierLabel, beginnerLabel, categoryPresentation, categoryLabel } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
import { achievementDecorations } from "./decoration-registry.ts";

test("only registered Domain identifiers resolve, in registration order", () => {
  assert.equal(domainMotif(["Unknown", "Photography", "Cafe"]), "life-photo");
  assert.equal(domainMotif(["Cafe"]), "life-cafe");
  assert.equal(domainMotif(["Nature"]), "life-nature");
  assert.equal(domainMotif(["Music"]), "life-music");
  assert.equal(domainMotif(["Research"]), "life-research");
  assert.equal(domainMotif(["Writing"]), "life-creation");
  assert.equal(domainMotif(["料理", "カフェ", "__proto__"]), "life-general");
  assert.equal(domainMotif([]), "life-general");
});
test("approved IDs require the exact prefix; user emoji inside names remain untouched", () => {
  const item = { id: "3a4391a3-54a9-8166-9b6d-dc2bdde050d0", name: "🎵 一曲ぶんの散歩 🐈", domains: ["Exercise"] };
  assert.deepEqual(achievementPresentation(item), { motif: "life-music", name: "一曲ぶんの散歩 🐈" });
  assert.equal(item.name, "🎵 一曲ぶんの散歩 🐈");
  assert.deepEqual(achievementPresentation({ ...item, id: "another" }), { motif: "life-general", name: item.name });
  assert.deepEqual(achievementPresentation({ ...item, name: "🐈 自分の文章" }), { motif: "life-general", name: "🐈 自分の文章" });
  for (const [id, prefix, motif] of [
    ["3a4391a3-54a9-815e-a951-e81e874c9b40", "🪞 ", "life-discovery"],
    ["3a4391a3-54a9-81cd-9ad1-e02417134d11", "🪟 ", "life-window"],
  ]) assert.deepEqual(achievementPresentation({ id, name: prefix + "名前", domains: [] }), { motif, name: "名前" });
});
test("Tier and Beginner presentation do not invent classifications or strip arbitrary text", () => {
  assert.equal(tierLabel("⭐⭐ Uncommon"), "Uncommon");
  assert.equal(tierLabel("⭐ Common"), "Common");
  assert.equal(tierLabel(null), "Tier未設定");
  assert.equal(tierLabel("Unknown"), "Tier未設定");
  assert.equal(beginnerLabel("🌱 Beginner"), "Beginner");
  assert.equal(beginnerLabel("Beginner"), "Beginner");
  assert.equal(beginnerLabel("🌱 My Beginner story"), null);
});

test("all 111 confirmed IDs remove only their exact prefix and preserve interior emoji", () => {
  assert.equal(Object.keys(achievementDecorations).length, 111);
  for (const [id, { prefix }] of Object.entries(achievementDecorations)) {
    const name = prefix + "名前の中の ☕ は残す";
    const item = { id, name, domains: ["Cafe"] };
    assert.equal(achievementPresentation(item).name, "名前の中の ☕ は残す");
    assert.equal(item.name, name);
    assert.equal(achievementPresentation({ ...item, name: "🐈 新しい名前" }).name, "🐈 新しい名前");
  }
  assert.equal(achievementPresentation({ id: "new-record", name: "☕ ユーザーの名前", domains: [] }).name, "☕ ユーザーの名前");
});

test("only exact registered categories change; unknown labels and query values remain untouched", () => {
  assert.deepEqual(categoryPresentation("🌿 日常"), { label: "日常", motif: "life-nature" });
  assert.equal(categoryLabel("🎨 創作"), "創作");
  assert.equal(categoryLabel("🧪 探索"), "探索");
  for (const value of ["🧠 内面", "💪 身体", "🎸 育成"]) assert.ok(!/^\p{Extended_Pictographic}/u.test(categoryLabel(value)));
  assert.equal(categoryLabel("🌿 私のカテゴリ"), "🌿 私のカテゴリ");
  assert.equal(categoryLabel(null), "未分類");
  assert.equal(categoryLabel("__proto__"), "__proto__");
});

test("all 28 approved symbols retain their supplied paths and small variants", () => {
  const approved = readFileSync(new URL("../../../../docs/design/life-os-icons-v1/sprite.svg", import.meta.url), "utf8");
  const implementation = readFileSync(new URL("./icon-sprite.tsx", import.meta.url), "utf8");
  const ids = [...approved.matchAll(/<symbol id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 28);
  for (const id of ids) assert.ok(implementation.includes(`id="${id}"`), id);
  const paths = text => [...text.matchAll(/\bd="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(paths(implementation), paths(approved));
  const component = readFileSync(new URL("./life-icon.tsx", import.meta.url), "utf8");
  assert.ok(component.includes('size <= 20 ? "-small" : ""'));
});
