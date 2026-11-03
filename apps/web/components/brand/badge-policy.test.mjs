import assert from "node:assert/strict";
import test from "node:test";
import { badgeTier, badgeMotif } from "./badge-policy.ts";

test("Tier normalization distinguishes Uncommon and leaves missing/unsupported tiers neutral", () => {
  for (const tier of ["Common", "Uncommon", "Rare", "Epic", "Legendary"]) {
    assert.equal(badgeTier(tier), tier.toLowerCase());
  }
  assert.equal(badgeTier("UNCOMMON ☆☆"), "uncommon");
  for (const tier of [null, undefined, "", "Extraordinary", "Commonplace"]) assert.equal(badgeTier(tier), "unknown");
});

test("Only explicit supported domains receive illustrative motifs; order is stable", () => {
  assert.equal(badgeMotif(["Cafe"]), "cafe");
  assert.equal(badgeMotif(["Photography"]), "photo");
  assert.equal(badgeMotif(["Nature"]), "nature");
  assert.equal(badgeMotif(["Cooking", "Nature", "Cafe"]), "nature");
  assert.equal(badgeMotif(["Cooking"]), "star");
  assert.equal(badgeMotif([]), "star");
});
