import assert from "node:assert/strict";
import test from "node:test";
import { saveLogWithPhotos } from "./log-save-flow.ts";

test("attachment failure keeps text log and retry reuses the same page", async () => {
  let saved = null;
  let creates = 0;
  let fail = true;
  const deps = {
    find: async () => saved,
    create: async () => { creates++; saved = { pageId: "one-log", url: "https://notion.so/one-log" }; return saved; },
    attach: async () => { if (fail) throw new Error("Notion unavailable"); },
  };
  const first = await saveLogWithPhotos(deps);
  assert.equal(first.ok, false);
  assert.equal(first.log.pageId, "one-log");
  fail = false;
  const retry = await saveLogWithPhotos(deps);
  assert.equal(retry.ok, true);
  assert.equal(retry.log.pageId, "one-log");
  assert.equal(creates, 1);
});

test("creation failure never calls attachment or modifies achievement state", async () => {
  let attachments = 0;
  await assert.rejects(saveLogWithPhotos({ find: async () => null, create: async () => { throw new Error("create failed"); }, attach: async () => { attachments++; } }));
  assert.equal(attachments, 0);
});
