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
const { changeQuestState: runQuestChange } = await import(moduleUrl("./service.ts", { "./policy": policyUrl }));
const { createQuestCoordinator } = await import(moduleUrl("./coordinator.ts"));
function memoryCoordinator() {
  const locks = new Map();
  const store = { claim: async (key) => { if (locks.has(key)) return null; locks.set(key, "etag"); return "etag"; }, release: async (key, etag) => { assert.equal(locks.get(key), etag); locks.delete(key); } };
  return { coordinate: createQuestCoordinator(store), locks, store };
}
const changeQuestState = (repo, input, now) => runQuestChange(repo, input, now, memoryCoordinator().coordinate);
const id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ds = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const playerId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const revision = "2026-11-04T00:00:00.000Z";
const now = Date.parse("2026-11-04T03:00:00Z");
const base = { id, dataSourceId: ds, playerIds: [playerId], lifecycle: "Active", archived: false, state: "Available", revision, completedAt: null, availableFrom: null, dueAt: null, rewardXp: 25, completionCondition: "Try the experience" };
function memory(record = {}) {
  let current = { ...base, ...record };
  const writes = [];
  return { writes, validateCompletionConfiguration: async () => {}, current: () => current, complete: async (pageId, completedAt) => { writes.push({ pageId, state: "Completed", completedAt }); current = { ...current, state: "Completed", completedAt }; }, readContext: async () => ({ record: current, dataSourceId: ds, playerId }), setState: async (pageId, state) => { writes.push({ pageId, state }); current = { ...current, state, revision: "2026-11-04T03:00:00.000Z" }; } };
}
const input = (operation = "accept", overrides = {}) => ({ id, revision, operation, ...(operation === "complete" ? { confirmed: "yes" } : {}), ...overrides });

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
  for (const invalid of [{ id: null }, { id: "a".repeat(36) }, { id: "" }, { operation: "delete" }, { operation: "__proto__" }, { revision: null }, { revision: "yesterday" }]) await assert.rejects(changeQuestState(repo, input("accept", invalid), now));
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
    "Reward XP": { type: "number", number: 25 }, "Completion Condition": { type: "rich_text", rich_text: [{ plain_text: "Try the experience" }] }, ...overrides,
  } };
}
function sdk(pages = [page()], players = [{ object: "page", id: playerId, properties: {}, archived: false, in_trash: false }]) {
  const calls = [];
  return { calls, dataSources: { retrieve: async (args) => ({ properties: args.data_source_id === "status-source" ? { "Total XP": { type: "formula", formula: { expression: 'prop("Achievement XP") + prop("Quest XP")' } }, "Quest XP": { type: "rollup", rollup: { function: "sum", relation_property_name: "Quests", rollup_property_name: "Earned XP" } }, "Achievement XP": { type: "rollup", rollup: { function: "sum", relation_property_name: "Achievements", rollup_property_name: "Earned XP" } }, "Completed Quests": { type: "rollup", rollup: { function: "checked", relation_property_name: "Quests", rollup_property_name: "Is Completed" } } } : { State: { type: "select", select: { options: [{name:"Completed"}] } }, "Reward XP": { type: "number" }, "Completed At": { type: "date" }, "Earned XP": { type: "formula", formula: { expression: 'if(prop("State") == "Completed", prop("Reward XP"), 0)' } }, "Is Completed": { type: "formula", formula: { expression: 'prop("State") == "Completed"' } } } }), query: async (args) => { calls.push(args); return { results: args.data_source_id === "status-source" ? players : args.start_cursor ? [] : pages, has_more: args.data_source_id === ds && !args.start_cursor, next_cursor: "cursor-2" }; } }, pages: { retrieve: async () => pages[0], update: async (args) => { calls.push(args); pages[0].properties = { ...pages[0].properties, ...args.properties }; return pages[0]; } } };
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
const lockUrl = `data:text/javascript;base64,${Buffer.from('export const coordinateQuestOperation = async (key, work) => work(() => {});').toString("base64")}`;
const { changeQuestAction } = await import(moduleUrl("../../../app/actions/quest-actions.ts", {
  "next/cache": cacheUrl,
  "@/lib/life-os/quests/operation-lock": lockUrl,
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

test("completion records one timestamp and retry is read-only, even when repeatable metadata exists", async () => {
  const repo = memory({ state: "Accepted", repeatable: true });
  const mutex = memoryCoordinator();
  assert.deepEqual(await runQuestChange(repo, input("complete"), now, mutex.coordinate), { state: "Completed", changed: true });
  const completedAt = repo.current().completedAt;
  assert.deepEqual(await runQuestChange(repo, input("complete"), now + 5000, mutex.coordinate), { state: "Completed", changed: false });
  assert.equal(repo.writes.length, 1);
  assert.equal(repo.current().completedAt, completedAt);
  assert.equal(mutex.locks.size, 0);
  await assert.rejects(runQuestChange(repo, input("release"), now, mutex.coordinate));
  await assert.rejects(runQuestChange(repo, input("accept"), now, mutex.coordinate));
});

test("completion requires acceptance, server-side confirmation, defined condition and valid reward", async () => {
  for (const overrides of [{ state: "Available" }, { state: "Skipped" }, { state: "Expired" }, { completedAt: revision }, { rewardXp: null }, { rewardXp: -1 }, { rewardXp: NaN }, { completionCondition: "  " }]) {
    const repo = memory({ state: "Accepted", ...overrides });
    await assert.rejects(changeQuestState(repo, input("complete"), now));
    assert.equal(repo.writes.length, 0);
  }
  for (const confirmed of [null, false, "true", ""]) await assert.rejects(changeQuestState(memory({ state: "Accepted" }), input("complete", { confirmed }), now));
  const free = memory({ state: "Accepted", rewardXp: 0 });
  await changeQuestState(free, input("complete"), now);
  assert.equal(free.writes.length, 1);
});

test("completion after an existing due date remains possible without new penalties", async () => {
  const repo = memory({ state: "Accepted", dueAt: "2000-01-01" });
  await changeQuestState(repo, input("complete"), now);
  assert.equal(repo.current().state, "Completed");
});

test("completion and release from different requests share one fence", async () => {
  const repo = memory({ state: "Accepted" });
  const mutex = memoryCoordinator();
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  let finish;
  const barrier = new Promise((resolve) => { finish = resolve; });
  const complete = repo.complete;
  repo.complete = async (...args) => { entered(); await barrier; await complete(...args); };
  const first = runQuestChange(repo, input("complete"), now, mutex.coordinate);
  await started;
  await assert.rejects(runQuestChange(repo, input("release"), now, mutex.coordinate), /更新を確認中/);
  finish(); await first;
  assert.equal(repo.writes.length, 1);
  assert.equal(repo.current().state, "Completed");
  assert.equal(mutex.locks.size, 0);
});

test("a release that wins the fence prevents completion against its stale accepted snapshot", async () => {
  const repo = memory({ state: "Accepted" });
  const mutex = memoryCoordinator();
  await runQuestChange(repo, input("release"), now, mutex.coordinate);
  await assert.rejects(runQuestChange(repo, input("complete"), now, mutex.coordinate), /受注中/);
  assert.deepEqual(repo.writes, [{ pageId: id, state: "Available" }]);
});

test("fresh state is rechecked under the fence rather than trusting preflight", async () => {
  const repo = memory({ state: "Accepted" });
  let reads = 0;
  const read = repo.readContext;
  repo.readContext = async () => { const ctx = await read(); reads++; if (reads === 2) ctx.record = { ...ctx.record, revision: "2026-11-05T00:00:00.000Z" }; return ctx; };
  await assert.rejects(changeQuestState(repo, input("complete"), now), /別の画面/);
  assert.equal(repo.writes.length, 0);
});

test("an ambiguous write keeps its fence and never retries an unknown Notion update", async () => {
  const repo = memory({ state: "Accepted" });
  const mutex = memoryCoordinator();
  let attempts = 0;
  repo.complete = async () => { attempts++; throw new Error("connection lost"); };
  await assert.rejects(runQuestChange(repo, input("complete"), now, mutex.coordinate), /connection lost/);
  assert.equal(mutex.locks.size, 1);
  await assert.rejects(runQuestChange(repo, input("complete"), now + 100000, mutex.coordinate), /更新を確認中/);
  await assert.rejects(runQuestChange(repo, input("release"), now, mutex.coordinate), /更新を確認中/);
  assert.equal(attempts, 1);
});

test("a lost completion response reconciles from Notion without timestamp or XP rewrites", async () => {
  const repo = memory({ state: "Accepted" });
  const mutex = memoryCoordinator();
  const complete = repo.complete;
  repo.complete = async (...args) => { await complete(...args); throw new Error("response lost"); };
  await assert.rejects(runQuestChange(repo, input("complete"), now, mutex.coordinate));
  assert.equal(mutex.locks.size, 1);
  assert.deepEqual(await runQuestChange(repo, input("complete"), now + 5000, mutex.coordinate), { state: "Completed", changed: false });
  assert.equal(repo.writes.length, 1);
  assert.equal(repo.current().completedAt, new Date(now).toISOString());
});

test("read failures release unused fences; cleanup failures never roll back success", async () => {
  const repo = memory({ state: "Accepted" });
  const mutex = memoryCoordinator();
  const read = repo.readContext;
  let reads = 0;
  repo.readContext = async () => { if (++reads === 2) throw new Error("read failed"); return read(); };
  await assert.rejects(runQuestChange(repo, input("complete"), now, mutex.coordinate));
  assert.equal(mutex.locks.size, 0);
  repo.readContext = read;
  const coord = createQuestCoordinator({ ...mutex.store, release: async () => { throw new Error("cleanup failed"); } });
  assert.equal((await runQuestChange(repo, input("complete"), now, coord)).changed, true);
  assert.equal(repo.current().state, "Completed");
});

test("real repository completion sends only State + Completed At, preserves configured XP", async () => {
  const client = sdk([page({ State: { type: "select", select: { name: "Accepted" } } })]);
  transport.use(client);
  await changeQuestState(questRepository, input("complete"), now);
  assert.deepEqual(client.calls.at(-1), { page_id: id, properties: {
    State: { type: "select", select: { name: "Completed" } },
    "Completed At": { type: "date", date: { start: new Date(now).toISOString() } },
  } });
  assert.equal(client.calls.some((c) => c.properties && ("Reward XP" in c.properties || "Earned XP" in c.properties || "Player" in c.properties)), false);
  await assert.rejects(questRepository.setState(id, "Completed"));
});

test("completion has its own server feature gate and revalidates HOME and Status", async () => {
  const oldActions = process.env.QUEST_ACTIONS_ENABLED;
  const oldCompletion = process.env.QUEST_COMPLETION_ENABLED;
  try {
    process.env.QUEST_ACTIONS_ENABLED = "true";
    delete process.env.QUEST_COMPLETION_ENABLED;
    const client = sdk([page({ State: { type: "select", select: { name: "Accepted" } } })]);
    transport.use(client);
    assert.equal((await changeQuestAction(null, form("complete"))).ok, false);
    assert.equal(client.calls.length, 0);
    process.env.QUEST_COMPLETION_ENABLED = "true";
    const request = form("complete"); request.set("confirmed", "yes");
    paths.length = 0;
    assert.equal((await changeQuestAction(null, request)).ok, true);
    assert.deepEqual(paths, ["/quests", `/quests/${id}`, "/", "/status"]);
  } finally {
    if (oldActions === undefined) delete process.env.QUEST_ACTIONS_ENABLED; else process.env.QUEST_ACTIONS_ENABLED = oldActions;
    if (oldCompletion === undefined) delete process.env.QUEST_COMPLETION_ENABLED; else process.env.QUEST_COMPLETION_ENABLED = oldCompletion;
  }
});

const blobUrl = `data:text/javascript;base64,${Buffer.from('export const objects = new Map(); export const calls=[]; export async function put(path,body,options){calls.push({path,options});if(objects.has(path)) throw new Error("exists"); objects.set(path,"etag"); return {etag:"etag"}} export async function del(path,options){if(objects.get(path)!==options.ifMatch)throw new Error("etag");objects.delete(path)}').toString("base64")}`;
const blob = await import(blobUrl);
const { coordinateQuestOperation } = await import(moduleUrl("./operation-lock.ts", { "@vercel/blob": blobUrl, "./coordinator": moduleUrl("./coordinator.ts") }));
test("real Blob adapter uses private conditional creation and the same key across deployment environments", async () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const env = process.env.VERCEL_ENV;
  try {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    await assert.rejects(coordinateQuestOperation(`${ds}/${id}`, async () => {}), /not configured/);
    process.env.BLOB_READ_WRITE_TOKEN = "fake-token-no-network";
    for (const name of ["preview", "production"]) {
      process.env.VERCEL_ENV = name;
      await coordinateQuestOperation(`${ds}/${id}`, async () => "ok");
      assert.equal(blob.objects.size, 0);
    }
    assert.equal(blob.calls[0].path, blob.calls[1].path);
    assert.equal(blob.calls[0].options.access, "private");
    assert.equal(blob.calls[0].options.allowOverwrite, false);
    assert.equal(blob.calls[0].options.addRandomSuffix, false);
  } finally {
    if (token === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = token;
    if (env === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = env;
  }
});

test("unexpected reward schema is refused before write and releases the fence", async () => {
  const client = sdk([page({ State: { type: "select", select: { name: "Accepted" } } })]);
  const retrieve = client.dataSources.retrieve;
  client.dataSources.retrieve = async (args) => { const schema = await retrieve(args); if (args.data_source_id === ds) schema.properties["Earned XP"].formula.expression = "1000000"; return schema; };
  transport.use(client);
  const mutex = memoryCoordinator();
  await assert.rejects(runQuestChange(questRepository, input("complete"), now, mutex.coordinate), /集計設定/);
  assert.equal(client.calls.some((call) => call.properties), false);
  assert.equal(mutex.locks.size, 0);
});

test("unfinished reward formulas remain unknown rather than being coerced to zero", async () => {
  for (const [value, expected] of [[null, null], [0, 0], [25, 25]]) {
    transport.use(sdk([page({ "Earned XP": { type: "formula", formula: { type: "number", number: value } } })]));
    const quests = await readQuests();
    assert.equal(quests[0].earnedXp, expected);
  }
});
