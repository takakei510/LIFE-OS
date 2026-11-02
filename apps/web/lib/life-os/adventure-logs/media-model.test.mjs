import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMediaUrl } from "../../notion/media.ts";

test("normalizes photo/audio and reads fresh signed URLs without storing them", () => {
  const first = normalizeMediaUrl("photo.PNG", "https://example.com/photo.png?expires=1");
  const next = normalizeMediaUrl("photo.PNG", "https://example.com/photo.png?expires=2");
  assert.equal(first.mediaType, "image");
  assert.notEqual(first.displayUrl, next.displayUrl);
  assert.equal(normalizeMediaUrl("sound.m4a", "https://example.com/sound").mediaType, "audio");
});
test("rejects executable, insecure and broken media URLs", () => {
  for (const url of [null, "javascript:alert(1)", "data:image/png;base64,x", "http://example.com/photo.png", "not-a-url"]) assert.equal(normalizeMediaUrl("photo.png", url).displayUrl, null);
});
