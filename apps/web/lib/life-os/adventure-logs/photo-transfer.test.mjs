import assert from "node:assert/strict";
import test from "node:test";
import { transferPhotoOnce } from "./photo-transfer.ts";
import { photoOwnerDigest, signPhotoGrant, verifyPhotoGrant } from "./photo-grants.ts";
import { validatePhotoMetadata } from "./photo-policy.ts";

const result = { id: "notion-upload", filename: "photo.jpg", contentType: "image/jpeg", size: 500 };
function provider() {
  let state = null;
  let calls = 0;
  let cleanupCalls = 0;
  const deps = {
    read: async () => state,
    claim: async () => { if (state) return null; state = { status: "pending" }; return "etag"; },
    upload: async () => { calls++; return result; },
    complete: async (_, value) => { state = { status: "complete", result: value }; },
    cleanup: async () => { cleanupCalls++; },
    releaseInvalid: async () => { state = null; },
  };
  return { deps, counts: () => ({ calls, cleanupCalls }), state: () => state };
}

test("concurrent and repeated finalization transfer exactly once", async () => {
  const mock = provider();
  const results = await Promise.allSettled([transferPhotoOnce(mock.deps), transferPhotoOnce(mock.deps)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.deepEqual(await transferPhotoOnce(mock.deps), result);
  assert.equal(mock.counts().calls, 1);
});

test("ambiguous Notion failure keeps durable claim; no automatic resend", async () => {
  const mock = provider();
  let attempts = 0;
  mock.deps.upload = async () => { attempts++; throw new Error("network response lost"); };
  await assert.rejects(transferPhotoOnce(mock.deps));
  await assert.rejects(transferPhotoOnce(mock.deps), /TRANSFER_PENDING/);
  assert.equal(attempts, 1);
  assert.equal(mock.state().status, "pending");
});

test("cleanup failure retries cleanup without resending to Notion", async () => {
  const mock = provider();
  mock.deps.cleanup = async () => { throw new Error("cleanup unavailable"); };
  await assert.rejects(transferPhotoOnce(mock.deps));
  mock.deps.cleanup = async () => {};
  assert.deepEqual(await transferPhotoOnce(mock.deps), result);
  assert.equal(mock.counts().calls, 1);
});

test("known invalid image releases its claim, without contacting Notion", async () => {
  const mock = provider();
  mock.deps.upload = async () => { throw new Error("INVALID_PHOTO"); };
  await assert.rejects(transferPhotoOnce(mock.deps), /INVALID_PHOTO/);
  assert.equal(mock.state(), null);
  assert.equal(mock.counts().calls, 0);
});

test("signed batch rejects forgery, cross-browser ownership and expiry", () => {
  const grant = { version: 1, owner: photoOwnerDigest("owner-A"), requestId: "request", batchId: "batch", expiresAt: 1000, photos: [result] };
  const signed = signPhotoGrant(grant, "test-secret");
  assert.deepEqual(verifyPhotoGrant(signed, "owner-A", "test-secret", 999), grant);
  assert.throws(() => verifyPhotoGrant(signed, "owner-B", "test-secret", 999));
  assert.throws(() => verifyPhotoGrant(signed, grant.owner, "test-secret", 999));
  assert.throws(() => verifyPhotoGrant(signed, "owner-A", "test-secret", 1000));
  assert.throws(() => verifyPhotoGrant(signed, "owner-A", "wrong-secret", 999));
  assert.throws(() => verifyPhotoGrant(signed + "x", "owner-A", "test-secret", 999));
});

test("metadata policy handles free-plan size, dangerous names and mismatched extensions", () => {
  assert.equal(validatePhotoMetadata({ ...result, size: 5 * 1024 * 1024 }), true);
  for (const invalid of [{ ...result, size: 5 * 1024 * 1024 + 1 }, { ...result, size: 0 }, { ...result, filename: "../photo.jpg" }, { ...result, filename: "bad\n.jpg" }, { ...result, filename: "photo.png" }]) assert.equal(validatePhotoMetadata(invalid), false);
});
