import assert from "node:assert/strict";
import test from "node:test";
import { badgeTier } from "./badge-policy.ts";

test("Tier normalization distinguishes Uncommon and leaves missing/unsupported tiers neutral", () => {
  for (const tier of ["Common", "Uncommon", "Rare", "Epic", "Legendary"]) {
    assert.equal(badgeTier(tier), tier.toLowerCase());
  }
  assert.equal(badgeTier("UNCOMMON ☆☆"), "uncommon");
  for (const tier of [null, undefined, "", "Extraordinary", "Commonplace"]) assert.equal(badgeTier(tier), "unknown");
});
