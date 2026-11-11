"use server";

import { revalidatePath } from "next/cache";
import { unlockAchievementPage } from "@/lib/notion/repositories/achievements";
import { readAchievementAccess } from "@/lib/notion/repositories/achievement-tree";

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
    if (process.env.LIFE_OS_CLUSTER_RULES?.trim()) {
      try {
        await readAchievementAccess(true);
        revalidatePath("/achievements/[id]", "page");
      } catch {
        // The achievement write already succeeded. Discovery can be retried on the map.
        console.error("Could not save cluster discovery after achievement unlock");
      }
    }
    revalidatePath("/");
    revalidatePath("/achievements");
    revalidatePath("/achievements/tree");
    revalidatePath(`/achievements/${achievementId}`);
    revalidatePath("/status");
    return { ok: true, unlockedAt };
  } catch (error) {
    console.error("Failed to unlock achievement", error);
    return { ok: false, message: "実績を解除できませんでした。もう一度試してください。" };
  }
}

export async function discoverClustersAction(_previous: string | null, _formData: FormData): Promise<string | null> {
  if (!process.env.LIFE_OS_CLUSTER_RULES?.trim()) return null;
  try {
    await readAchievementAccess(true);
    revalidatePath("/");
    revalidatePath("/achievements");
    revalidatePath("/achievements/tree");
    revalidatePath("/achievements/[id]", "page");
    revalidatePath("/status");
    return null;
  } catch {
    return "発見を保存できませんでした。時間をおいてもう一度お試しください。";
  }
}
