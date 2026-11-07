import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function moduleUrl(path, imports = {}) {
  let source = readFileSync(new URL(path, import.meta.url), "utf8").replace('import "server-only";', "");
  for (const [name, url] of Object.entries(imports)) source = source.replaceAll(`from "${name}"`, `from "${url}"`);
  return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
}
const policyUrl = moduleUrl("./policy.ts");
const { normalizedId, isOwnedActiveQuest, questStateLabel, canAcceptQuest } = await import(policyUrl);
const { changeQuestState } = await import(moduleUrl("./service.ts", { "./policy": policyUrl }));
const id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ds = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const playerId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const revision = "2026-11-04T00:00:00.000Z";
const now = Date.parse("2026-11-04T03:00:00Z");
const base = { id, dataSourceId: ds, playerIds: [playerId], lifecycle: "Active", archived: false, state: "Available", revision, completedAt: null, availableFrom: null, dueAt: null };
function memory(record = {}) {
  let current = { ...base, ...record };
  const writes = [];
  return { writes, readContext: async () => ({ record: current, dataSourceId: ds, playerId }), setState: async (pageId, state) => { writes.push({ pageId, state }); current = { ...current, state, revision: "2026-11-04T03:00:00.000Z" }; } };
}
const input = (operation = "accept", overrides = {}) => ({ id, revision, operation, ...overrides });

test("accept and retry write State once, release restores Available without rewards", async () => {
  const repo = memory();
  assert.deepEqual(await changeQuestState(repo, input(), now), { state: "Accepted", changed: true });
  assert.deepEqual(await changeQuestState(repo, input(), now), { state: "Accepted", changed: false });
  await changeQuestState(repo, input("release", { revision: "2026-11-04T03:00:00.000Z" }), now);
  await changeQuestState(repo, input("release"), now);
  assert.deepEqual(repo.writes, [{ pageId: id, state: "Accepted" }, { pageId: id, state: "Available" }]);
});

test("malformed IDs, operations, revisions are rejected before repository reads", async () => {
  const repo = { readContext: () => assert.fail("no read expected"), setState: () => assert.fail("no write expected") };
  for (const invalid of [{ id: null }, { id: "a".repeat(36) }, { id: "" }, { operation: "complete" }, { operation: "__proto__" }, { revision: null }, { revision: "yesterday" }]) await assert.rejects(changeQuestState(repo, input("accept", invalid), now));
  assert.equal(normalizedId(id.toUpperCase().replaceAll("-", "")), normalizedId(id));
});

test("wrong source, owner, multiple owners, hidden lifecycle, trash and missing identity cannot mutate", async () => {
  for (const change of [{ id: ds }, { dataSourceId: playerId }, { dataSourceId: null }, { playerIds: [] }, { playerIds: [id] }, { playerIds: [playerId, id] }, { lifecycle: null }, { lifecycle: "Draft" }, { lifecycle: "Archived" }, { archived: true }]) {
    const repo = memory(change);
    await assert.rejects(changeQuestState(repo, input(), now));
    assert.equal(repo.writes.length, 0);
  }
  assert.equal(isOwnedActiveQuest(base, ds, playerId), true);
});

test("completed/skipped/expired/unknown states and completed date are never reset", async () => {
  for (const state of ["Completed", "Skipped", "Expired", null, "Not Completed", "Unaccepted"]) for (const operation of ["accept", "release"]) {
    const repo = memory({ state });
    await assert.rejects(changeQuestState(repo, input(operation), now));
    assert.equal(repo.writes.length, 0);
  }
  await assert.rejects(changeQuestState(memory({ completedAt: revision }), input(), now));
  assert.equal(questStateLabel("Not Completed"), "状態未設定");
  assert.equal(questStateLabel("Skipped"), "見送り");
});

test("stale tab cannot reverse a newer change", async () => {
  const repo = memory({ revision: "2026-11-04T01:00:00.000Z" });
  await assert.rejects(changeQuestState(repo, input(), now), /別の画面/);
  assert.equal(repo.writes.length, 0);
});

test("scheduled dates use Japan calendar boundaries; release remains penalty-free after due date", async () => {
  assert.equal(canAcceptQuest({ availableFrom: "2026-11-04", dueAt: "2026-11-04" }, Date.parse("2026-11-03T15:00:00Z")), true);
  assert.equal(canAcceptQuest({ availableFrom: "2026-11-04", dueAt: "2026-11-04" }, Date.parse("2026-11-04T14:59:59.999Z")), true);
  assert.equal(canAcceptQuest({ availableFrom: "2026-11-04", dueAt: null }, Date.parse("2026-11-03T14:59:59Z")), false);
  assert.equal(canAcceptQuest({ availableFrom: null, dueAt: "2026-11-04" }, Date.parse("2026-11-04T15:00:00Z")), false);
  for (const change of [{ availableFrom: "2099-01-01" }, { dueAt: "2000-01-01" }, { dueAt: "invalid" }]) {
    await assert.rejects(changeQuestState(memory(change), input(), now));
    const repo = memory({ ...change, state: "Accepted" });
    await changeQuestState(repo, input("release"), now);
    assert.equal(repo.writes[0].state, "Available");
  }
});

test("provider failure surfaces and never produces a success result", async () => {
  const repo = memory();
  repo.setState = async () => { throw new Error("provider failure"); };
  await assert.rejects(changeQuestState(repo, input(), now), /provider failure/);
});

// Run the real repository with a fake SDK transport: no network or Notion writes.
const transportUrl = `data:text/javascript;base64,${Buffer.from('export let client; export function use(value) {client=value} export function getNotionClient(){return client} export function getServerEnv(){return {NOTION_STATUS_DATA_SOURCE_ID:"status-source",NOTION_QUESTS_DATA_SOURCE_ID:"' + ds + '"}}').toString("base64")}`;
const transport = await import(transportUrl);
const propertiesUrl = moduleUrl("../../notion/properties.ts", { "./media": moduleUrl("../../notion/media.ts") });
const { readQuests, questRepository } = await import(moduleUrl("../../notion/repositories/quests.ts", {
  "@/lib/env": transportUrl, "@/lib/notion/client": transportUrl,
  "@/lib/notion/properties": propertiesUrl, "@/lib/life-os/quests/policy": policyUrl,
}));
function page(overrides = {}) {
  return { object: "page", id, archived: false, in_trash: false, parent: { type: "data_source_id", data_source_id: ds }, last_edited_time: revision, url: "https://notion.so/quest", properties: {
    Name: { type: "title", title: [{ plain_text: "My quest" }] }, State: { type: "select", select: { name: "Available" } },
    Lifecycle: { type: "select", select: { name: "Active" } }, Player: { type: "relation", relation: [{ id: playerId }], has_more: false },
    "Reward XP": { type: "number", number: 25 }, ...overrides,
  } };
}
function sdk(pages = [page()], players = [{ object: "page", id: playerId, properties: {}, archived: false, in_trash: false }]) {
  const calls = [];
  return { calls, dataSources: { query: async (args) => { calls.push(args); return { results: args.data_source_id === "status-source" ? players : args.start_cursor ? [] : pages, has_more: args.data_source_id === ds && !args.start_cursor, next_cursor: "cursor-2" }; } }, pages: { retrieve: async () => pages[0], update: async (args) => { calls.push(args); return pages[0]; } } };
}
test("real repository paginates, normalizes DTO and excludes non-owner/inactive records", async () => {
  const bad = page({ Player: { type: "relation", relation: [{ id }] } });
  const draft = page({ Lifecycle: { type: "select", select: { name: "Draft" } } });
  const truncated = page({ Player: { type: "relation", relation: [{ id: playerId }], has_more: true } });
  const client = sdk([page(), bad, draft, truncated]);
  transport.use(client);
  const quests = await readQuests();
  assert.equal(quests.length, 1);
  assert.equal(quests[0].canAccept, true);
  assert.equal(quests[0].canRelease, false);
  assert.equal(quests[0].rewardXp, 25);
  assert.equal(client.calls[2].start_cursor, "cursor-2");
  assert.deepEqual(client.calls[1].filter.and[1], { property: "Player", relation: { contains: playerId } });
});

test("single PLAYER is required; no arbitrary first record fallback", async () => {
  for (const players of [[], [{ object: "page", id: playerId, properties: {} }, { object: "page", id, properties: {} }]]) {
    transport.use(sdk([page()], players));
    await assert.rejects(readQuests(), /一意/);
    await assert.rejects(questRepository.readContext(id), /一意/);
  }
});

test("full service plus real repository sends exactly State, never XP or Completed At", async () => {
  const client = sdk();
  transport.use(client);
  await changeQuestState(questRepository, input(), now);
  assert.deepEqual(client.calls.at(-1), { page_id: id, properties: { State: { type: "select", select: { name: "Accepted" } } } });
  transport.use(sdk([page({ State: { type: "status", status: { name: "Available" } } })]));
  await assert.rejects(changeQuestState(questRepository, input(), now));
});

const cacheUrl = `data:text/javascript;base64,${Buffer.from('export const paths=[]; export function revalidatePath(path){paths.push(path)}').toString("base64")}`;
const repoUrl = moduleUrl("../../notion/repositories/quests.ts", {
  "@/lib/env": transportUrl, "@/lib/notion/client": transportUrl,
  "@/lib/notion/properties": propertiesUrl, "@/lib/life-os/quests/policy": policyUrl,
});
const { changeQuestAction } = await import(moduleUrl("../../../app/actions/quest-actions.ts", {
  "next/cache": cacheUrl,
  "@/lib/life-os/quests/service": moduleUrl("./service.ts", { "./policy": policyUrl }),
  "@/lib/notion/repositories/quests": repoUrl,
}));
const { paths } = await import(cacheUrl);
function form(operation = "accept") {
  const value = new FormData();
  value.set("questId", id); value.set("revision", revision); value.set("operation", operation);
  return value;
}
test("server action is disabled by default, including forged requests", async () => {
  const before = process.env.QUEST_ACTIONS_ENABLED;
  try {
    delete process.env.QUEST_ACTIONS_ENABLED;
    const client = sdk(); transport.use(client);
    assert.equal((await changeQuestAction(null, form())).ok, false);
    assert.equal(client.calls.length, 0);
  } finally { if (before === undefined) delete process.env.QUEST_ACTIONS_ENABLED; else process.env.QUEST_ACTIONS_ENABLED = before; }
});

test("server action revalidates list/detail only on success and hides provider details", async () => {
  const before = process.env.QUEST_ACTIONS_ENABLED;
  try {
    process.env.QUEST_ACTIONS_ENABLED = "true";
    transport.use(sdk());
    paths.length = 0;
    assert.equal((await changeQuestAction(null, form())).ok, true);
    assert.deepEqual(paths, ["/quests", `/quests/${id}`]);
    const client = sdk(); client.pages.update = async () => { throw new Error("secret-provider-detail"); };
    transport.use(client); paths.length = 0;
    const result = await changeQuestAction(null, form());
    assert.equal(result.ok, false);
    assert.doesNotMatch(result.message, /secret-provider/);
    assert.equal(paths.length, 0);
    assert.equal((await changeQuestAction(null, form("complete"))).ok, false);
  } finally { if (before === undefined) delete process.env.QUEST_ACTIONS_ENABLED; else process.env.QUEST_ACTIONS_ENABLED = before; }
});
