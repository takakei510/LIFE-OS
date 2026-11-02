export const MAX_PHOTO_COUNT = 5;
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};

export type PhotoMetadata = { filename: string; contentType: string; size: number };

export function validatePhotoMetadata(value: unknown): value is PhotoMetadata {
  if (!value || typeof value !== "object") return false;
  const p = value as PhotoMetadata;
  if (typeof p.filename !== "string" || p.filename.length > 180 || /[\\/\x00-\x1f\x7f]/.test(p.filename)) return false;
  const ext = p.filename.slice(p.filename.lastIndexOf(".")).toLowerCase();
  return Object.hasOwn(PHOTO_TYPES, ext) && PHOTO_TYPES[ext] === p.contentType &&
    Number.isSafeInteger(p.size) && p.size > 0 && p.size <= MAX_PHOTO_SIZE_BYTES;
}
