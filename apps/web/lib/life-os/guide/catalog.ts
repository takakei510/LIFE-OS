export type Candidate = {
  id: string; kind: "achievement" | "quest"; name: string; condition: string;
  category: string; domains: string[]; axis: string; time: string; minutes: number | null;
  cost: string; environment: string; people: string; energy: string; needs: string;
  firstStep: string; longTerm: boolean; relatedIds: string[];
};
export type GuideInput = {
  message: string; minutes: number | null; environment: "any" | "home" | "outdoor";
  budget: "any" | "free"; people: "any" | "solo"; energy: "any" | "low";
  kind: "any" | "achievement" | "quest";
};
export function parseInput(value: unknown): GuideInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("入力を確認してください。");
  const v = value as Record<string, unknown>;
  if (typeof v.message !== "string" || !v.message.trim() || v.message.length > 600) throw new Error("相談は1〜600文字で入力してください。");
  if (v.minutes !== null && ![5, 15, 30, 60, 120, 240].includes(v.minutes as number)) throw new Error("時間を選び直してください。");
  const choices = { environment: ["any", "home", "outdoor"], budget: ["any", "free"], people: ["any", "solo"], energy: ["any", "low"], kind: ["any", "achievement", "quest"] };
  for (const [key, options] of Object.entries(choices)) if (!options.includes(v[key] as string)) throw new Error("条件を選び直してください。");
  return { message: v.message.trim(), minutes: v.minutes as number | null, environment: v.environment as GuideInput["environment"], budget: v.budget as GuideInput["budget"], people: v.people as GuideInput["people"], energy: v.energy as GuideInput["energy"], kind: v.kind as GuideInput["kind"] };
}
export function parseMetadata(text: string) {
  const clean = text.replace(/<br\s*\/?\s*>/gi, "\n");
  const field = (label: string) => clean.match(new RegExp(`(?:^|\\n)${label}:\\s*([^\\n]+)`))?.[1]?.trim() ?? "";
  const time = field("時間");
  const times = [...time.matchAll(/(\d+)\s*(分|時間)/g)].map(m => Number(m[1]) * (m[2] === "時間" ? 60 : 1));
  const minutes = times.length ? Math.max(...times) : time.includes("半日") ? 240 : null;
  return { axis: field("実績の軸") || clean.match(/^(気づく|挑む|会得する)/)?.[1] || "", time, minutes,
    cost: field("費用"), environment: field("環境"), people: field("人数"), energy: field("気力").split(" /")[0],
    needs: field("必要なもの"), firstStep: field("最初の一歩"), longTerm: /会得まで|練習1回/.test(time) };
}
export function filterCandidates(catalog: Candidate[], input: GuideInput): Candidate[] {
  const seen = new Set<string>();
  return catalog.filter(c => {
    if (input.kind !== "any" && c.kind !== input.kind) return false;
    if (input.minutes !== null && (c.minutes === null || c.minutes > input.minutes)) return false;
    if (input.budget === "free" && (!/^無料（|^無料$/.test(c.cost) || /少額|予算/.test(c.cost))) return false;
    if (input.energy === "low" && c.energy !== "軽め") return false;
    if (input.people === "solo" && c.people !== "一人で可能") return false;
    if (input.environment === "home" && (!/屋内|台所|窓辺|場所を問わない/.test(c.environment) || /施設|公共|教室|誰かと/.test(c.environment))) return false;
    if (input.environment === "outdoor" && !/屋外/.test(c.environment)) return false;
    const key = c.condition.normalize("NFKC").replace(/\s/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
export type ModelAnswer = { message: string; picks: { id: string; reason: string; firstStep: string }[] };
export function shortlistCandidates(candidates: Candidate[], message: string): Candidate[] {
  const topics: [RegExp, string[]][] = [
    [/料理|食べ|台所/, ["Cooking", "Cafe"]], [/音楽|楽器|演奏|聴/, ["Music"]],
    [/写真|カメラ|撮影/, ["Photography"]], [/本|読書|物語/, ["Reading", "Writing"]],
    [/自然|植物|鳥|空|散歩/, ["Nature"]], [/プログラム|コード|技術|AI|パソコン/i, ["Programming", "AI", "Gadget"]],
    [/交流|人と|話し|会話/, ["Relationship", "Communication"]], [/運動|身体|スポーツ/, ["Exercise", "Sport"]],
  ];
  const preferred = topics.filter(([pattern]) => pattern.test(message)).flatMap(([, domains]) => domains);
  // Interleave categories within each relevance score to avoid a single database's order dominating.
  const ranked = candidates.map(c => ({ c, score: c.domains.some(d => preferred.includes(d)) ? 1 : 0 })).sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id));
  const buckets = new Map<string, Candidate[]>();
  for (const {c, score} of ranked) { const key = `${score}:${c.category}:${c.kind}`; buckets.set(key, [...(buckets.get(key) ?? []), c]); }
  const result: Candidate[] = [];
  for (const score of [1, 0]) {
    const groups = [...buckets.entries()].filter(([k]) => k.startsWith(`${score}:`)).map(([,v]) => v);
    while (groups.some(g => g.length) && result.length < 60) for (const group of groups) { const c = group.shift(); if (c && result.length < 60) result.push(c); }
  }
  return result;
}
export type GuideResult = { message: string; picks: { candidate: Candidate; reason: string; firstStep: string }[] };
export function validateAnswer(value: unknown, candidates: Candidate[]): GuideResult {
  if (!value || typeof value !== "object") throw new Error("Invalid AI response");
  const v = value as ModelAnswer;
  if (typeof v.message !== "string" || v.message.length > 350 || !Array.isArray(v.picks) || v.picks.length > 3) throw new Error("Invalid AI response");
  const ids = new Set<string>();
  const usedAchievements = new Set<string>();
  const picks = v.picks.map(p => {
    if (!p || typeof p.id !== "string" || typeof p.reason !== "string" || !p.reason.trim() || p.reason.length > 240 || typeof p.firstStep !== "string" || !p.firstStep.trim() || p.firstStep.length > 180) throw new Error("Invalid AI response");
    const candidate = candidates.find(c => c.id === p.id);
    if (!candidate || ids.has(p.id)) throw new Error("Unknown or duplicate candidate");
    ids.add(p.id);
    const related = candidate.kind === "achievement" ? [candidate.id] : candidate.relatedIds;
    if (related.some(id => usedAchievements.has(id))) throw new Error("Duplicate experience");
    related.forEach(id => usedAchievements.add(id));
    return { candidate, reason: p.reason.trim(), firstStep: candidate.firstStep || p.firstStep.trim() };
  });
  return { message: v.message.trim(), picks };
}
