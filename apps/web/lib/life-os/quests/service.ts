import { isOwnedActiveQuest, normalizedId, planQuestCompletion, planQuestTransition } from "./policy";
import type { QuestRecord, QuestState } from "./policy";
import type { QuestCoordinator } from "./coordinator";

export type QuestRepository = {
  readContext: (id: string) => Promise<{ record: QuestRecord; dataSourceId: string; playerId: string }>;
  setState: (id: string, state: QuestState) => Promise<void>;
  complete: (id: string, completedAt: string) => Promise<void>;
};

export async function changeQuestState(repository: QuestRepository, input: { id: unknown; operation: unknown; revision: unknown; confirmed?: unknown }, now: number, coordinate: QuestCoordinator) {
  if (!normalizedId(input.id) || (input.operation !== "accept" && input.operation !== "release" && input.operation !== "complete")
    || typeof input.revision !== "string" || !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(input.revision) || !Number.isFinite(Date.parse(input.revision))) {
    throw new Error("送信情報を確認できませんでした。画面を再読み込みしてください。");
  }
  const id = input.id as string;
  if (input.operation === "complete" && input.confirmed !== "yes") throw new Error("達成条件を確認してから、完了を記録してください。");
  const context = await repository.readContext(id);
  const verify = ({ record, dataSourceId, playerId }: typeof context) => {
    if (normalizedId(record.id) !== normalizedId(id) || !isOwnedActiveQuest(record, dataSourceId, playerId)) throw new Error("操作できるクエストが見つかりません。");
  };
  verify(context);
  // A completed record is terminal. Lost responses and retained fences can be
  // reconciled read-only without ever applying a second reward or timestamp.
  if (input.operation === "complete" && context.record.state === "Completed") return { state: "Completed", changed: false };
  const key = `${normalizedId(context.dataSourceId)}/${normalizedId(id)}`;
  return coordinate(key, async (markWriteStarted) => {
    const fresh = await repository.readContext(id);
    verify(fresh);
    if (normalizedId(fresh.dataSourceId) !== normalizedId(context.dataSourceId) || normalizedId(fresh.playerId) !== normalizedId(context.playerId)) throw new Error("操作できるクエストが見つかりません。");
    const { record } = fresh;
    if (input.operation === "complete") {
      if (!planQuestCompletion(record, input.revision as string)) return { state: "Completed", changed: false };
      markWriteStarted();
      await repository.complete(id, new Date(now).toISOString());
      return { state: "Completed", changed: true };
    }
    const target = planQuestTransition(record, input.operation as "accept" | "release", input.revision as string, now);
    if (target) { markWriteStarted(); await repository.setState(id, target); }
    return { state: target ?? record.state, changed: target !== null };
  });
}
