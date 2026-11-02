import "server-only";

import { getUnlockedAchievementPage } from "@/lib/notion/repositories/achievements";
import { createTextAdventureLog, findAdventureLogByRequestId, attachAdventureLogPhotos } from "@/lib/notion/repositories/adventure-logs";
import { resolvePhotoAttachments, claimLogCreation, attachPhotosOnce } from "./photo-attachments";
import { saveLogWithPhotos } from "./log-save-flow";
import type { CreateAdventureLogInput, CreateAdventureLogResult } from "./types";
import { validateCreateAdventureLogInput } from "./validation";

function dateLabel(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function pageTitle(page: Awaited<ReturnType<typeof getUnlockedAchievementPage>>): string {
  const property = page.properties.Name;
  if (property?.type !== "title") return "";
  return property.title.map((item) => item.plain_text).join("").trim();
}

function generatedName(
  name: string,
  achievementName: string | undefined,
  memo: string,
  location: string,
  loggedAt: string,
): string {
  if (name) return name;
  const icon = memo ? "📝" : location ? "📍" : "✨";
  return `${icon} ${achievementName || "小さな冒険"}｜${dateLabel(loggedAt)}`;
}

export async function createAdventureLog(input: CreateAdventureLogInput): Promise<CreateAdventureLogResult> {
  const validated = validateCreateAdventureLogInput(input);
  if (!validated.ok) return validated.result;

  try {
    const photos = input.photoGrant ? await resolvePhotoAttachments(input.photoGrant, validated.value.requestId) : [];

    let verifiedAchievementName = validated.value.achievementName;
    if (validated.value.relatedAchievementId) {
      const achievement = await getUnlockedAchievementPage(validated.value.relatedAchievementId);
      verifiedAchievementName = pageTitle(achievement) || verifiedAchievementName;
    }

    const saved = await saveLogWithPhotos({
      find: async () => {
        const existing = await findAdventureLogByRequestId(validated.value.requestId);
        return existing ? { pageId: existing.id, url: existing.url } : null;
      },
      create: async () => {
        await claimLogCreation(validated.value.requestId);
        const created = await createTextAdventureLog({
      requestId: validated.value.requestId,
      name: generatedName(
        validated.value.name,
        verifiedAchievementName,
        validated.value.memo,
        validated.value.location,
        validated.value.loggedAt,
      ),
      memo: validated.value.memo,
      location: validated.value.location,
      loggedAt: validated.value.loggedAt,
      logTypes: [
        ...(validated.value.memo ? ["Text"] : []),
        ...(validated.value.location ? ["Place"] : []),
      ],
      relatedAchievementId: validated.value.relatedAchievementId,
        });
        return { pageId: created.id, url: created.url };
      },
      attach: async (log) => {
        if (photos.length) await attachPhotosOnce(validated.value.requestId, log.pageId, photos, () => attachAdventureLogPhotos(validated.value.requestId, log.pageId, photos));
      },
    });

    if (!saved.ok) return { ok: false, textSaved: true, ...saved.log, message: "思い出の文章・場所は保存済みですが、写真の添付を確認できませんでした。再試行できます。実績解除は取り消されていません。" };
    return { ok: true, ...saved.log };
  } catch {
    console.error("Failed to create Adventure Log");
    return { ok: false, message: "思い出を保存できませんでした。実績解除は取り消されていません。" };
  }
}
