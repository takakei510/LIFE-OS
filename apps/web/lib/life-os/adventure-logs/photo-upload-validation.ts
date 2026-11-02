const MAX_PHOTO_COUNT = 5;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

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

async function hasMatchingImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const matches = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);
  switch (file.type) {
    case "image/jpeg":
      return matches([0xff, 0xd8, 0xff]);
    case "image/png":
      return matches([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return matches([0x52, 0x49, 0x46, 0x46]) && matches([0x57, 0x45, 0x42, 0x50], 8);
    default:
      return false;
  }
}

export async function validatePhotoUploads(values: FormDataEntryValue[]): Promise<PhotoValidationResult> {
  if (values.length === 0) return { ok: false, message: "写真が選択されていません。" };
  if (values.length > MAX_PHOTO_COUNT) return { ok: false, message: `写真は最大${MAX_PHOTO_COUNT}枚までです。` };

  const photos: ValidatedPhoto[] = [];
  for (const value of values) {
    if (!(value instanceof File)) return { ok: false, message: "不正なアップロードデータです。" };
    if (value.size <= 0) return { ok: false, message: `${value.name}：空のファイルはアップロードできません。` };
    if (value.size > MAX_PHOTO_SIZE_BYTES) return { ok: false, message: `${value.name}：Notion無料プランでは1枚5MiB以下にしてください。` };

    const expectedContentType = CONTENT_TYPE_BY_EXTENSION[extension(value.name)];
    if (!expectedContentType || value.type !== expectedContentType) {
      return { ok: false, message: `${value.name}：JPEG・PNG・WebPのみアップロードできます。` };
    }

    if (!(await hasMatchingImageSignature(value))) {
      return { ok: false, message: `${value.name}：画像の内容と形式が一致しません。` };
    }

    photos.push({ file: value, filename: value.name, contentType: expectedContentType });
  }

  return { ok: true, photos };
}
