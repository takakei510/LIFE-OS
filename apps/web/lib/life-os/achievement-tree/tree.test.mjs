import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

function moduleUrl(path, imports = {}) {
  let source = readFileSync(new URL(path, import.meta.url), "utf8").replace('import "server-only";', "");
  for (const [name, url] of Object.entries(imports)) source = source.replaceAll(`from "${name}"`, `from "${url}"`);
  return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString("base64")}`;
}
const modelUrl = moduleUrl("./model.ts");
const { buildTreeModel, publicTreeAchievements } = await import(modelUrl);
const { layoutTree, edgePath, NODE_WIDTH, NODE_HEIGHT } = await import(moduleUrl("./radial-layout.ts"));
function record(id, prerequisites = [], overrides = {}, relationComplete = true) {
  return { achievement: { id, name: `Secret ${id}`, category: "探索", domains: ["photo"], tier: "Rare", xp: 30, requirement: `Condition ${id}`, flavorText: `Flavor ${id}`, unlocked: false, unlockedAt: null, visibility: "Visible", url: `https://notion.so/${id}`, ...overrides }, prerequisites, relationComplete };
}

test("all prerequisites must be unlocked, with normalized and deduplicated edges", () => {
  const records = [record("AA-AA", [], { unlocked: true }), record("b"), record("c", ["aaaa", "AA-AA", "b"]), record("d", ["AAAA"])];
  const model = buildTreeModel(records, true);
  assert.deepEqual(model.nodes.map(n => n.state), ["unlocked", "available", "locked", "available"]);
  assert.equal(model.edges.length, 3);
  assert.equal(model.nodes[2].prerequisiteCount, 2);
  assert.equal(model.nodes[3].name, "Secret d");
});

test("masked names, conditions, flavor, tier, XP, domains and source URLs never reach public DTOs", () => {
  const records = [record("a"), record("b", ["a"])];
  for (const value of [buildTreeModel(records, true), publicTreeAchievements(records)]) {
    const json = JSON.stringify(value);
    for (const secret of ["Secret b", "Condition b", "Flavor b", "https://notion.so/b"]) assert.ok(!json.includes(secret));
  }
  const node = buildTreeModel(records, true).nodes[1];
  assert.deepEqual([node.name, node.tier, node.xp, node.domains, node.href], ["？？？", null, null, [], null]);
  assert.equal(publicTreeAchievements(records)[1].lockedByChain, true);
});

test("hidden prerequisites do not expose their identity or edges; unlocked hidden records remain visible", () => {
  const records = [record("hidden-id", [], { visibility: "Hidden" }), record("child", ["hidden-id"]), record("earned", [], { visibility: "Hidden", unlocked: true })];
  const model = buildTreeModel(records, true);
  assert.deepEqual(model.nodes.map(n => n.id), ["child", "earned"]);
  assert.deepEqual(model.edges, []);
  assert.ok(!JSON.stringify(model).includes("hidden-id"));
  assert.equal(model.nodes[0].state, "locked");
});

test("missing references, incomplete reads, self loops, cycles and their descendants fail closed", () => {
  const model = buildTreeModel([record("missing", ["absent"]), record("incomplete", [], {}, false), record("self", ["self"]), record("a", ["b"]), record("b", ["a"]), record("child", ["a"]), record("earned", ["absent"], { unlocked: true })], true);
  assert.deepEqual(model.nodes.map(n => n.state), ["review", "review", "review", "review", "review", "review", "unlocked"]);
  assert.ok(model.nodes.slice(0, 6).every(n => n.masked));
  assert.equal(model.nodes[6].masked, false);
});

test("layout preserves real topology, fits all nodes and never overlaps disconnected blocks or cycles", () => {
  const records = [record("root"), record("left", ["root"]), record("right", ["root"]), record("join", ["left", "right"]), record("x", ["y"]), record("y", ["x"]), ...Array.from({ length: 260 }, (_, i) => record(`island-${i}`))];
  const model = buildTreeModel(records, true);
  const layout = layoutTree(model);
  assert.equal(layout.nodes.length, records.length);
  assert.deepEqual(layout.edges, model.edges);
  for (const a of layout.nodes) {
    assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y));
    assert.ok(a.x >= 0 && a.y >= 0 && a.x + NODE_WIDTH <= layout.width && a.y + NODE_HEIGHT <= layout.height);
    for (const b of layout.nodes) if (a.id !== b.id) assert.ok(a.x + NODE_WIDTH <= b.x || b.x + NODE_WIDTH <= a.x || a.y + NODE_HEIGHT <= b.y || b.y + NODE_HEIGHT <= a.y);
  }
  const positions = new Map(layout.nodes.map(n => [n.id, n]));
  assert.equal(positions.get("root").depth, 0);
  assert.equal(positions.get("join").depth, 2);
  assert.deepEqual(layoutTree({ nodes: [], edges: [] }).nodes, []);
});

test("a single root is central, shared descendants appear once outside both roots", () => {
  const single = layoutTree(buildTreeModel([record("root"), record("leaf", ["root"])], true));
  const root = single.nodes.find(n => n.id === "root");
  assert.equal(root.x + NODE_WIDTH / 2, single.clusters[0].x);
  assert.equal(root.y + NODE_HEIGHT / 2, single.clusters[0].y);
  assert.equal(root.isRoot, true);
  const shared = layoutTree(buildTreeModel([record("r1"), record("r2"), record("join", ["r1", "r2"])], true));
  assert.equal(shared.clusters.length, 1);
  assert.equal(shared.clusters[0].roots, 2);
  assert.equal(shared.nodes.filter(n => n.id === "join").length, 1);
  assert.equal(shared.nodes.find(n => n.id === "join").depth, 1);
  assert.equal(shared.edges.length, 2);
  for (const edge of shared.edges) assert.ok(!edgePath(shared.nodes.find(n => n.id === edge.from), shared.nodes.find(n => n.id === edge.to)).match(/NaN|Infinity/));
});

test("layout does not depend on API page order and never invents roots for hidden references", () => {
  const records = [record("a"), record("b", ["a"]), record("c"), record("d", ["c"]), record("unknown", ["absent"])];
  assert.deepEqual(layoutTree(buildTreeModel(records, true)).nodes, layoutTree(buildTreeModel([...records].reverse(), true)).nodes);
  const unknown = layoutTree(buildTreeModel(records, true)).nodes.find(n => n.id === "unknown");
  assert.equal(unknown.isRoot, false);
});

test("wide rings and 1000 independent achievements remain finite without overlapping labels", () => {
  const model = buildTreeModel([record("root"), ...Array.from({ length: 48 }, (_, i) => record(`child-${i}`, ["root"]))], true);
  const layout = layoutTree(model);
  for (const a of layout.nodes) for (const b of layout.nodes) if (a.id !== b.id) assert.ok(a.x + NODE_WIDTH <= b.x || b.x + NODE_WIDTH <= a.x || a.y + NODE_HEIGHT <= b.y || b.y + NODE_HEIGHT <= a.y);
  const many = layoutTree(buildTreeModel(Array.from({ length: 1000 }, (_, i) => record(`independent-${i}`)), true));
  assert.equal(many.nodes.length, 1000);
  assert.equal(many.clusters.length, 1000);
  assert.equal(many.edges.length, 0);
  assert.ok(many.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)));
});

// Exercise the actual repository with an SDK transport double, never live Notion.
const ds = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const transportUrl = `data:text/javascript;base64,${Buffer.from(`export let client; export function use(value){client=value} export function getNotionClient(){return client} export function getServerEnv(){return {NOTION_ACHIEVEMENTS_DATA_SOURCE_ID:"${ds}"}}`).toString("base64")}`;
const transport = await import(transportUrl);
const propertiesUrl = moduleUrl("../../notion/properties.ts", { "./media": moduleUrl("../../notion/media.ts") });
const readerUrl = moduleUrl("../../notion/repositories/achievement-tree.ts", { "@/lib/env": transportUrl, "@/lib/notion/client": transportUrl, "@/lib/notion/properties": propertiesUrl });
const { readAchievementTreeRecords } = await import(readerUrl);
const { unlockAchievementPage } = await import(moduleUrl("../../notion/repositories/achievements.ts", { "@/lib/env": transportUrl, "@/lib/notion/client": transportUrl, "./achievement-tree": readerUrl, "@/lib/life-os/achievement-tree/model": modelUrl }));
function page(id = "a", overrides = {}, extra = {}) {
  return { object: "page", id, parent: { type: "data_source_id", data_source_id: ds }, archived: false, in_trash: false, url: "https://notion.so/example", properties: {
    Name: { type: "title", title: [{ plain_text: `Name ${id}` }] }, Lifecycle: { type: "select", select: { name: "Active" } },
    Unlocked: { type: "checkbox", checkbox: false }, Prerequisites: { id: "relation-property", type: "relation", relation: [], has_more: false }, ...overrides,
  }, ...extra };
}
function sdk(pages = [page()]) {
  const calls = [], writes = [];
  return { calls, writes, dataSources: { query: async args => { calls.push(args); return { results: pages, has_more: false }; } }, pages: { retrieve: async ({ page_id }) => pages.find(p => p.id === page_id), update: async args => { writes.push(args); return pages.find(p => p.id === args.page_id); }, properties: { retrieve: async () => assert.fail("unexpected relation paging") } } };
}

test("repository paginates achievement pages and excludes inactive, foreign and archived pages", async () => {
  const client = sdk();
  client.dataSources.query = async args => { client.calls.push(args); return args.start_cursor ? { results: [page("b")], has_more: false } : { results: [page(), page("draft", { Lifecycle: { type: "select", select: { name: "Draft" } } }), page("trash", {}, { in_trash: true }), page("archive", {}, { archived: true }), page("foreign", {}, { parent: { type: "data_source_id", data_source_id: "other" } })], has_more: true, next_cursor: "next" }; };
  transport.use(client);
  assert.deepEqual((await readAchievementTreeRecords()).map(r => r.achievement.id), ["a", "b"]);
  assert.equal(client.calls[1].start_cursor, "next");
  assert.deepEqual(client.calls[0].filter, { property: "Lifecycle", select: { equals: "Active" } });
});

test("repository follows relation-property pagination beyond the embedded 25 references", async () => {
  const client = sdk([page("a", { Prerequisites: { id: "relation-property", type: "relation", relation: [{ id: "embedded-only" }], has_more: true } })]);
  const calls = [];
  client.pages.properties.retrieve = async args => { calls.push(args); return { object: "list", results: Array.from({ length: args.start_cursor ? 5 : 25 }, (_, i) => ({ type: "relation", relation: { id: `${args.start_cursor ? 25 : 0 + i}-${i}` } })), has_more: !args.start_cursor, next_cursor: "more" }; };
  transport.use(client);
  const [result] = await readAchievementTreeRecords();
  assert.equal(result.prerequisites.length, 30);
  assert.equal(result.relationComplete, true);
  assert.equal(calls[1].start_cursor, "more");
  assert.equal(calls[0].property_id, "relation-property");
  assert.ok(!result.prerequisites.includes("embedded-only"));
});

test("relation failures and missing properties are masked; broken achievement pagination rejects the snapshot", async () => {
  for (const response of [null, { object: "list", results: [], has_more: true, next_cursor: null }, { object: "list", results: [], has_more: true, next_cursor: "repeated" }]) {
    const client = sdk([page("a", { Prerequisites: { id: "rel", type: "relation", relation: [], has_more: true } })]);
    client.pages.properties.retrieve = async () => { if (!response) throw new Error("provider failure"); return response; };
    transport.use(client);
    const records = await readAchievementTreeRecords();
    assert.equal(records[0].relationComplete, false);
    assert.equal(buildTreeModel(records, true).nodes[0].state, "review");
  }
  transport.use(sdk([page("a", { Prerequisites: undefined })]));
  assert.equal((await readAchievementTreeRecords())[0].relationComplete, false);
  const client = sdk(); client.dataSources.query = async () => ({ results: [], has_more: true, next_cursor: "same" }); transport.use(client);
  await assert.rejects(readAchievementTreeRecords(), /Incomplete/);
});

test("unlock guards re-read prerequisites and never write for locked, uncertain or hidden records", async () => {
  for (const properties of [
    { Prerequisites: { type: "relation", relation: [{ id: "parent" }], has_more: false } },
    { Prerequisites: undefined },
    { Visibility: { type: "select", select: { name: "Hidden" } } },
  ]) {
    const client = sdk([page("a", properties), page("parent")]); transport.use(client);
    await assert.rejects(unlockAchievementPage("a", "2026-11-06"), /Prerequisite/);
    assert.equal(client.writes.length, 0);
  }
  const client = sdk([page("a", { Prerequisites: { type: "relation", relation: [{ id: "parent" }], has_more: false } }), page("parent", { Unlocked: { type: "checkbox", checkbox: true } })]); transport.use(client);
  await unlockAchievementPage("a", "2026-11-06");
  assert.deepEqual(client.writes, [{ page_id: "a", properties: { Unlocked: { type: "checkbox", checkbox: true }, "Unlocked At": { type: "date", date: { start: "2026-11-06" } } } }]);
});

test("already unlocked achievements are idempotent and never rewrite their unlock date", async () => {
  const client = sdk([page("a", { Unlocked: { type: "checkbox", checkbox: true } })]); transport.use(client);
  await unlockAchievementPage("a", "2026-11-06");
  assert.equal(client.writes.length, 0);
  assert.equal(client.calls.length, 0);
});
