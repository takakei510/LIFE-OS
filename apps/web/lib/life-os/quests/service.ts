import { isOwnedActiveQuest, normalizedId, planQuestTransition } from "./policy";
import type { QuestRecord, QuestState } from "./policy";

export type QuestRepository = {
  readContext: (id: string) => Promise<{ record: QuestRecord; dataSourceId: string; playerId: string }>;
  setState: (id: string, state: QuestState) => Promise<void>;
};

export async function changeQuestState(repository: QuestRepository, input: { id: unknown; operation: unknown; revision: unknown }, now = Date.now()) {
  if (!normalizedId(input.id) || (input.operation !== "accept" && input.operation !== "release")
    || typeof input.revision !== "string" || !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(input.revision) || !Number.isFinite(Date.parse(input.revision))) {
    throw new Error("送信情報を確認できませんでした。画面を再読み込みしてください。");
  }
  const id = input.id as string;
  const { record, dataSourceId, playerId } = await repository.readContext(id);
  if (normalizedId(record.id) !== normalizedId(id) || !isOwnedActiveQuest(record, dataSourceId, playerId)) throw new Error("操作できるクエストが見つかりません。");
  const target = planQuestTransition(record, input.operation, input.revision, now);
  if (target) await repository.setState(id, target);
  return { state: target ?? record.state, changed: target !== null };
}
