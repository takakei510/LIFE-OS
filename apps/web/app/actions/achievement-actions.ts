"use server";

import { revalidatePath } from "next/cache";
import { unlockAchievementPage } from "@/lib/notion/repositories/achievements";

export type UnlockAchievementState =
  | { ok: true; unlockedAt: string }
  | { ok: false; message: string }
  | null;

export async function unlockAchievementAction(
  _previousState: UnlockAchievementState,
  formData: FormData,
): Promise<UnlockAchievementState> {
  const achievementId = formData.get("achievementId");
  if (typeof achievementId !== "string" || !achievementId) {
    return { ok: false, message: "実績を確認できませんでした。" };
  }
  const unlockedAt = new Date().toISOString();
  try {
    await unlockAchievementPage(achievementId, unlockedAt);
    revalidatePath("/");
    revalidatePath("/achievements");
    revalidatePath(`/achievements/${achievementId}`);
    revalidatePath("/status");
    return { ok: true, unlockedAt };
  } catch (error) {
    console.error("Failed to unlock achievement", error);
    return { ok: false, message: "実績を解除できませんでした。もう一度試してください。" };
  }
}
