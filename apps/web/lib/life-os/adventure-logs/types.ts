export type CreateAdventureLogInput = {
  requestId: string;
  name?: string;
  memo?: string;
  location?: string;
  loggedAt?: string;
  relatedAchievementId?: string;
  achievementName?: string;
  relatedQuestId?: string;
};

export type CreateAdventureLogResult =
  | { ok: true; pageId: string; url: string }
  | { ok: false; fieldErrors?: Record<string, string>; message: string };
