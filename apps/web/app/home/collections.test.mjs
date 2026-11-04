import test from "node:test";
import assert from "node:assert/strict";
import { getCollections } from "./collections.ts";

test("collections count actual visible achievements, retaining unlocked secrets without leaking locked secrets", () => {
  const items = [
    { category: "日常", unlocked: true, visibility: "Public" },
    { category: "日常", unlocked: false, visibility: null },
    { category: "日常", unlocked: false, visibility: "Hidden" },
    { category: "探索", unlocked: true, visibility: "Secret" },
    { category: "非公開分類", unlocked: false, visibility: "隠し" },
    { category: null, unlocked: false, visibility: "Public" },
  ];
  const before = JSON.stringify(items);
  assert.deepEqual(getCollections(items), [
    { category: "日常", total: 2, unlocked: 1 },
    { category: "探索", total: 1, unlocked: 1 },
    { category: null, total: 1, unlocked: 0 },
  ]);
  assert.equal(JSON.stringify(items), before);
  assert.deepEqual(getCollections([]), []);
});
