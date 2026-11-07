"use server";

import { revalidatePath } from "next/cache";
import { changeQuestState } from "@/lib/life-os/quests/service";
import { questRepository } from "@/lib/notion/repositories/quests";

export type QuestActionState = { ok: boolean; message: string } | null;

export async function changeQuestAction(_previous: QuestActionState, form: FormData): Promise<QuestActionState> {
  // The existing single-player deployment protection authenticates every request,
  // including Server Actions. Enable only after checking that protection.
  if (process.env.QUEST_ACTIONS_ENABLED !== "true") return { ok: false, message: "受注機能は準備中です。" };
  const id = form.get("questId");
  const operation = form.get("operation");
  try {
    await changeQuestState(questRepository, { id, operation, revision: form.get("revision") });
  } catch (error) {
    const messages = ["送信情報を確認できませんでした。画面を再読み込みしてください。", "操作できるクエストが見つかりません。", "このクエストの受注状態は変更できません。", "別の画面で記録が更新されました。再読み込みして状態を確認してください。", "このクエストは現在、受注できる期間ではありません。"];
    return { ok: false, message: error instanceof Error && messages.includes(error.message) ? error.message : "状態を更新できませんでした。再読み込みして現在の状態を確認してから、もう一度お試しください。" };
  }
  revalidatePath("/quests");
  revalidatePath(`/quests/${id}`);
  return { ok: true, message: operation === "accept" ? "受注しました。気が向いたときに楽しんでください。" : "受注を取り消しました。またいつでも選べます。" };
}
