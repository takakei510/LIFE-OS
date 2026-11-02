export type SavedLog = { pageId: string; url: string };
export async function saveLogWithPhotos(deps: {
  find(): Promise<SavedLog | null>;
  create(): Promise<SavedLog>;
  attach(log: SavedLog): Promise<void>;
}): Promise<{ ok: true; log: SavedLog } | { ok: false; log: SavedLog }> {
  const log = (await deps.find()) ?? await deps.create();
  try { await deps.attach(log); return { ok: true, log }; }
  catch { return { ok: false, log }; }
}
