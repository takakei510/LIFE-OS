import assert from "node:assert/strict";
import test from "node:test";
import { validatePhotoUploads } from "./photo-upload-validation.ts";

const signatures = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 4, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
};
const photo = (name = "photo.jpg", type = "image/jpeg") =>
  new File([new Uint8Array(signatures[type] ?? [1])], name, { type });

test("accepts all supported signatures and preserves selection order", async () => {
  const files = [photo(), photo("photo.PNG", "image/png"), photo("photo.webp", "image/webp")];
  const result = await validatePhotoUploads(files);
  assert.equal(result.ok, true);
  assert.deepEqual(result.photos.map((p) => p.file), files);
});

test("enforces count, file values, empty files and size on the server", async () => {
  for (const values of [[], Array.from({ length: 6 }, () => photo()), ["text"], [new File([], "empty.jpg", { type: "image/jpeg" })], [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })]]) {
    assert.equal((await validatePhotoUploads(values)).ok, false);
  }
  assert.equal((await validatePhotoUploads(Array.from({ length: 5 }, () => photo()))).ok, true);
  const boundary = new Uint8Array(5 * 1024 * 1024);
  boundary.set(signatures["image/jpeg"]);
  assert.equal((await validatePhotoUploads([new File([boundary], "limit.jpg", { type: "image/jpeg" })])).ok, true);
});

test("rejects MIME/extension mismatch and disguised non-image content", async () => {
  for (const file of [photo("wrong.png"), photo("no-extension"), photo("script.svg", "image/svg+xml"), new File(["not an image"], "fake.jpg", { type: "image/jpeg" }), new File([new Uint8Array(signatures["image/png"])], "fake.jpg", { type: "image/jpeg" }), new File(["RIFF0000FAKE"], "fake.webp", { type: "image/webp" })]) {
    assert.equal((await validatePhotoUploads([file])).ok, false);
  }
});
