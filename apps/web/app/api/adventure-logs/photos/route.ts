import { NextResponse } from "next/server";

import { validatePhotoUploads } from "@/lib/life-os/adventure-logs/photo-upload-validation";
import { uploadPhotosToNotion } from "@/lib/notion/file-uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const validated = validatePhotoUploads(formData.getAll("photos"));
    if (!validated.ok) {
      return NextResponse.json({ ok: false, message: validated.message }, { status: 400 });
    }

    const uploads = await uploadPhotosToNotion(validated.photos);
    return NextResponse.json({ ok: true, uploads });
  } catch (error) {
    console.error("Failed to upload Adventure Log photos", error);
    return NextResponse.json(
      { ok: false, message: "写真をアップロードできませんでした。もう一度試してください。" },
      { status: 500 },
    );
  }
}
