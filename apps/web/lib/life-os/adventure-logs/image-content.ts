import sharp from "sharp";

export async function validateImageContent(bytes: ArrayBuffer, contentType: string): Promise<void> {
  try {
    const image = sharp(Buffer.from(bytes), { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    const expected = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[contentType];
    if (!expected || metadata.format !== expected || (metadata.pages ?? 1) > 1) throw new Error();
    await image.stats();
  } catch { throw new Error("INVALID_PHOTO"); }
}
