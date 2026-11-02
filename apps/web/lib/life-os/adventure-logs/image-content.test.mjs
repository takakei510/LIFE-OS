import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { validateImageContent } from "./image-content.ts";

test("fully decodes supported originals without changing their bytes", async () => {
  for (const [format, type] of [["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"]]) {
    const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).toFormat(format).toBuffer();
    const original = Buffer.from(bytes);
    await validateImageContent(bytes, type);
    assert.deepEqual(bytes, original);
    await assert.rejects(validateImageContent(bytes, type === "image/png" ? "image/jpeg" : "image/png"));
  }
});

test("rejects a forged header and truncated real image", async () => {
  await assert.rejects(validateImageContent(Buffer.from([0xff, 0xd8, 0xff, 0, 1]), "image/jpeg"));
  const bytes = await sharp({ create: { width: 16, height: 16, channels: 3, background: "blue" } }).png().toBuffer();
  await assert.rejects(validateImageContent(bytes.subarray(0, 32), "image/png"));
});
