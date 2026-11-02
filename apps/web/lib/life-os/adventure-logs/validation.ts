import type { CreateAdventureLogInput, CreateAdventureLogResult } from "./types";

const MAX_NAME_LENGTH = 120;
const MAX_MEMO_LENGTH = 2000;
const MAX_LOCATION_LENGTH = 200;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCreateAdventureLogInput(
  input: CreateAdventureLogInput,
):
  | {
      ok: true;
      value: Required<Pick<CreateAdventureLogInput, "requestId" | "name" | "memo" | "location" | "loggedAt">> &
        Pick<CreateAdventureLogInput, "relatedAchievementId" | "achievementName">;
    }
  | { ok: false; result: CreateAdventureLogResult } {
  const requestId = text(input.requestId);
  const name = text(input.name);
  const memo = text(input.memo);
  const location = text(input.location);
  const loggedAt = text(input.loggedAt);
  // datetime-local is explicitly labelled Japan time. Normalize it here rather
  // than depending on a browser hidden field or the server's local timezone.
  const zonedLoggedAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(loggedAt) ? `${loggedAt}+09:00` : loggedAt;
  const fieldErrors: Record<string, string> = {};

  if (!requestId || requestId.length > 100) {
    fieldErrors.requestId = "送信情報を確認できませんでした。画面を再読み込みしてください。";
  }
  if (name.length > MAX_NAME_LENGTH) fieldErrors.name = `タイトルは${MAX_NAME_LENGTH}文字以内にしてください。`;
  if (memo.length > MAX_MEMO_LENGTH) fieldErrors.memo = `Memoは${MAX_MEMO_LENGTH}文字以内にしてください。`;
  if (location.length > MAX_LOCATION_LENGTH) fieldErrors.location = `Locationは${MAX_LOCATION_LENGTH}文字以内にしてください。`;
  if (loggedAt && (!/(?:Z|[+-]\d{2}:\d{2})$/.test(zonedLoggedAt) || Number.isNaN(Date.parse(zonedLoggedAt)))) fieldErrors.loggedAt = "日時の形式が正しくありません。画面を再読み込みしてください。";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, result: { ok: false, message: "入力内容を確認してください。", fieldErrors } };
  }

  return {
    ok: true,
    value: {
      requestId,
      name,
      memo,
      location,
      loggedAt: zonedLoggedAt ? new Date(zonedLoggedAt).toISOString() : new Date().toISOString(),
      relatedAchievementId: text(input.relatedAchievementId) || undefined,
      achievementName: text(input.achievementName) || undefined,
    },
  };
}
