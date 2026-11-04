"use server";

import { revalidatePath } from "next/cache";
import { changeQuestState } from "@/lib/life-os/quests/service";
import { questRepository } from "@/lib/notion/repositories/quests";
import { coordinateQuestOperation } from "@/lib/life-os/quests/operation-lock";

export type QuestActionState = { ok: boolean; message: string } | null;

export async function changeQuestAction(_previous: QuestActionState, form: FormData): Promise<QuestActionState> {
  // The existing single-player deployment protection authenticates every request,
  // including Server Actions. Enable only after checking that protection.
  if (process.env.QUEST_ACTIONS_ENABLED !== "true") return { ok: false, message: "受注機能は準備中です。" };
  const id = form.get("questId");
  const operation = form.get("operation");
  if (operation === "complete" && process.env.QUEST_COMPLETION_ENABLED !== "true") return { ok: false, message: "完了の記録は準備中です。" };
  let changed = false;
  try {
    const result = await changeQuestState(questRepository, { id, operation, revision: form.get("revision"), confirmed: form.get("confirmed") }, Date.now(), coordinateQuestOperation);
    changed = result.changed;
  } catch (error) {
    const messages = ["送信情報を確認できませんでした。画面を再読み込みしてください。", "操作できるクエストが見つかりません。", "このクエストの受注状態は変更できません。", "別の画面で記録が更新されました。再読み込みして状態を確認してください。", "このクエストは現在、受注できる期間ではありません。", "受注中のクエストだけを完了できます。", "報酬の集計設定を確認できません。Notionの設定を確認してください。", "達成条件が設定されていません。Notionの設定を確認してください。", "達成条件を確認してから、完了を記録してください。", "達成報酬の設定を確認できません。Notionの設定を確認してください。", "このクエストの更新を確認中です。しばらくしてから最新の状態を確認してください。"];
    return { ok: false, message: error instanceof Error && messages.includes(error.message) ? error.message : "状態を更新できませんでした。再読み込みして現在の状態を確認してから、もう一度お試しください。" };
  }
  revalidatePath("/quests");
  revalidatePath(`/quests/${id}`);
  if (operation === "complete") {
    revalidatePath("/");
    revalidatePath("/status");
    return { ok: true, message: changed ? "完了を記録しました。報酬XPはNotionの集計を通して反映されます。" : "完了済みの記録を確認しました。" };
  }
  return { ok: true, message: operation === "accept" ? "受注しました。気が向いたときに楽しんでください。" : "受注を取り消しました。またいつでも選べます。" };
}
