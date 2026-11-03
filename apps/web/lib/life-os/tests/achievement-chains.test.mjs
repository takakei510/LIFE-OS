import assert from "node:assert/strict";
import test from "node:test";
import { isChainLocked, publicAchievement } from "../achievement-chains.ts";

function item(id, unlocked = false, prerequisites = []) {
  return {
    id, unlocked, prerequisites, name: "秘密の実績", requirement: "秘密の条件",
    flavorText: "秘密の説明", tier: "Rare", xp: 50, domains: ["Music"],
    category: "育成", evidenceHeadline: "秘密の豆知識", evidenceNote: "秘密の内容",
    evidenceSource: "https://example.org", evidenceStrength: "Mixed", url: "https://example.org/notion",
  };
}

test("ordinary achievement remains visible", () => {
  const a = item("a");
  assert.equal(isChainLocked(a, [a]), false);
});
test("unmet prerequisite conceals content and evidence", () => {
  const parent = item("p"), child = item("c", false, ["p"]);
  const masked = publicAchievement(child, [parent, child]);
  assert.equal(masked.lockedByChain, true);
  assert.equal(masked.name, "？？？");
  for (const key of ["requirement", "flavorText", "evidenceHeadline", "evidenceNote", "evidenceSource", "url"]) {
    assert.equal(masked[key], "");
  }
  assert.equal(masked.xp, 0);
  assert.equal(masked.tier, null);
});
test("unlocking all prerequisites reveals chain", () => {
  const a = item("a", true), b = item("b", true), c = item("c", false, ["a", "b"]);
  assert.equal(isChainLocked(c, [a, b, c]), false);
  assert.equal(publicAchievement(c, [a, b, c]).name, "秘密の実績");
});
test("missing or incomplete prerequisites fail closed", () => {
  const a = item("a", false, ["missing"]);
  assert.equal(isChainLocked(a, [a]), true);
});
test("already unlocked achievement remains visible even with missing prerequisite", () => {
  const a = item("a", true, ["missing"]);
  assert.equal(isChainLocked(a, [a]), false);
});
test("cyclic locked prerequisites remain hidden", () => {
  const a = item("a", false, ["b"]), b = item("b", false, ["a"]);
  assert.equal(isChainLocked(a, [a, b]), true);
  assert.equal(isChainLocked(b, [a, b]), true);
});
