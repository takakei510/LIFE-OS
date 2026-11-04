export type QuestOperation = "accept" | "release";
export type QuestState = "Available" | "Accepted" | "Completed" | "Skipped" | "Expired";

export function questStateLabel(state: string | null): string {
  switch (state) {
    case "Available": return "挑戦可能";
    case "Accepted": return "受注中";
    case "Completed": return "完了";
    case "Skipped": return "見送り";
    case "Expired": return "期間終了";
    default: return "状態未設定";
  }
}

export function normalizedId(value: unknown): string | null {
  if (typeof value !== "string" || !/^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(value)) return null;
  return value.replaceAll("-", "").toLowerCase();
}

export type QuestRecord = {
  id: string;
  dataSourceId: string | null;
  playerIds: string[];
  lifecycle: string | null;
  archived: boolean;
  state: string | null;
  revision: string;
  completedAt: string | null;
  availableFrom: string | null;
  dueAt: string | null;
};

export function isOwnedActiveQuest(record: QuestRecord, dataSourceId: string, playerId: string): boolean {
  return normalizedId(record.id) !== null && normalizedId(dataSourceId) !== null && normalizedId(playerId) !== null
    && normalizedId(record.dataSourceId) === normalizedId(dataSourceId)
    && !record.archived && record.lifecycle === "Active"
    && record.playerIds.length === 1 && normalizedId(record.playerIds[0]) === normalizedId(playerId);
}

// Date-only values use the app's Japan time zone. Acceptance creates no deadlines.
function boundary(value: string, end: boolean): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T${end ? "23:59:59.999" : "00:00:00.000"}+09:00` : value);
}

export function canAcceptQuest(record: Pick<QuestRecord, "availableFrom" | "dueAt">, now: number): boolean {
  const from = record.availableFrom === null ? -Infinity : boundary(record.availableFrom, false);
  const due = record.dueAt === null ? Infinity : boundary(record.dueAt, true);
  return now >= from && now <= due;
}

export function planQuestTransition(record: QuestRecord, operation: QuestOperation, revision: string, now: number): QuestState | null {
  if (record.completedAt !== null || !["Available", "Accepted"].includes(record.state ?? "")) throw new Error("このクエストの受注状態は変更できません。");
  const target = operation === "accept" ? "Accepted" : "Available";
  if (record.state === target) return null;
  if (record.revision !== revision) throw new Error("別の画面で記録が更新されました。再読み込みして状態を確認してください。");
  if (operation === "accept" && !canAcceptQuest(record, now)) throw new Error("このクエストは現在、受注できる期間ではありません。");
  return target;
}
