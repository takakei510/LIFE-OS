import "server-only";

import { getNotionClient } from "@/lib/notion/client";
import type { ValidatedPhoto } from "@/lib/life-os/adventure-logs/photo-upload-validation";

export type UploadedPhoto = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
};

export async function uploadPhotosToNotion(photos: ValidatedPhoto[]): Promise<UploadedPhoto[]> {
  const notion = getNotionClient();
  if (!notion) throw new Error("Notion is not configured.");

  const uploaded: UploadedPhoto[] = [];
  for (const photo of photos) {
    const created = await notion.fileUploads.create({
      mode: "single_part",
      filename: photo.filename,
      content_type: photo.contentType,
    });

    const sent = await notion.fileUploads.send({
      file_upload_id: created.id,
      file: {
        filename: photo.filename,
        data: photo.file,
      },
    });

    if (sent.status !== "uploaded") {
      throw new Error(`Notion upload did not complete for ${photo.filename}.`);
    }

    uploaded.push({
      id: sent.id,
      filename: sent.filename ?? photo.filename,
      contentType: sent.content_type ?? photo.contentType,
      size: sent.content_length ?? photo.file.size,
    });
  }

  return uploaded;
}
