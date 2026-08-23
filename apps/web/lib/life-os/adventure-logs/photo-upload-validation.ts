const MAX_PHOTO_COUNT = 5;
const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export type ValidatedPhoto = {
  file: File;
  filename: string;
  contentType: string;
};

export type PhotoValidationResult =
  | { ok: true; photos: ValidatedPhoto[] }
  | { ok: false; message: string };

function extension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

export function validatePhotoUploads(values: FormDataEntryValue[]): PhotoValidationResult {
  if (values.length === 0) return { ok: false, message: "写真が選択されていません。" };
  if (values.length > MAX_PHOTO_COUNT) return { ok: false, message: `写真は最大${MAX_PHOTO_COUNT}枚までです。` };

  const photos: ValidatedPhoto[] = [];
  for (const value of values) {
    if (!(value instanceof File)) return { ok: false, message: "不正なアップロードデータです。" };
    if (value.size <= 0) return { ok: false, message: `${value.name}：空のファイルはアップロードできません。` };
    if (value.size > MAX_PHOTO_SIZE_BYTES) return { ok: false, message: `${value.name}：1枚20MB以下にしてください。` };

    const expectedContentType = CONTENT_TYPE_BY_EXTENSION[extension(value.name)];
    if (!expectedContentType || value.type !== expectedContentType) {
      return { ok: false, message: `${value.name}：JPEG・PNG・WebPのみアップロードできます。` };
    }

    photos.push({ file: value, filename: value.name, contentType: expectedContentType });
  }

  return { ok: true, photos };
}
