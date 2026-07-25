import "server-only";

import { getUnlockedAchievementPage } from "@/lib/notion/repositories/achievements";
import { createTextAdventureLog, findAdventureLogByRequestId } from "@/lib/notion/repositories/adventure-logs";
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
  const sourceName = achievementName || "小さな冒険";
  return `${icon} ${sourceName}｜${dateLabel(loggedAt)}`;
}

export async function createAdventureLog(input: CreateAdventureLogInput): Promise<CreateAdventureLogResult> {
  const validated = validateCreateAdventureLogInput(input);
  if (!validated.ok) return validated.result;

  try {
    const existing = await findAdventureLogByRequestId(validated.value.requestId);
    if (existing) return { ok: true, pageId: existing.id, url: existing.url };

    let verifiedAchievementName = validated.value.achievementName;
    if (validated.value.relatedAchievementId) {
      const achievement = await getUnlockedAchievementPage(validated.value.relatedAchievementId);
      verifiedAchievementName = pageTitle(achievement) || verifiedAchievementName;
    }

    const logTypes = [
      ...(validated.value.memo ? ["Text"] : []),
      ...(validated.value.location ? ["Place"] : []),
    ];
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
      logTypes,
      relatedAchievementId: validated.value.relatedAchievementId,
    });

    return { ok: true, pageId: created.id, url: created.url };
  } catch (error) {
    console.error("Failed to create Adventure Log", error);
    return {
      ok: false,
      message: "思い出を保存できませんでした。実績の解除状態を確認して、もう一度試してください。",
    };
  }
}
