import assert from "node:assert/strict";
import { test } from "node:test";
import { planTitleEquipment } from "./title-equipment.ts";

test("switching clears the old equipment before setting the new title", () => {
  assert.deepEqual(planTitleEquipment(["old"], ["old"], "new", "equip"), [
    { id: "old", equipped: false },
    { id: "new", equipped: true },
  ]);
  assert.deepEqual(planTitleEquipment(["old", "new"], ["old", "new"], "new", "equip"), [
    { id: "old", equipped: false },
  ]);
});

test("stale requests cannot replace current equipment and retries are idempotent", () => {
  assert.throws(() => planTitleEquipment(["new"], ["old"], "other", "equip"), /STALE_TITLE_EQUIPMENT/);
  assert.deepEqual(planTitleEquipment(["new"], ["old"], "new", "equip"), []);
  assert.deepEqual(planTitleEquipment(["new"], ["old"], "old", "unequip"), []);
  assert.deepEqual(planTitleEquipment(["new"], ["NEW"], "new", "unequip"), [
    { id: "new", equipped: false },
  ]);
});
