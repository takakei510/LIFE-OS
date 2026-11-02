export function normalizeMediaUrl(name: string, rawUrl: string | null): { mediaType: "image" | "audio" | "other"; displayUrl: string | null } {
  let url: URL | null = null;
  try { url = rawUrl ? new URL(rawUrl) : null; } catch { /* Invalid provider data is not displayable. */ }
  const safeUrl = url?.protocol === "https:" ? url.href : null;
  const path = `${name} ${url?.pathname ?? ""}`.toLowerCase();
  const mediaType = /\.(jpe?g|png|webp)(?:$|\s)/.test(path) ? "image" : /\.(mp3|m4a|wav|ogg)(?:$|\s)/.test(path) ? "audio" : "other";
  return { mediaType, displayUrl: safeUrl };
}
