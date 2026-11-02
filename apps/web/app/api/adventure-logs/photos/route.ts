import { NextResponse } from "next/server";

import { validatePhotoUploads } from "@/lib/life-os/adventure-logs/photo-upload-validation";
import { uploadPhotosToNotion } from "@/lib/notion/file-uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, message: "許可されていない送信元です。" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    return NextResponse.json({ ok: false, message: "不正なアップロード形式です。" }, { status: 415 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "アップロードデータを読み取れませんでした。" }, { status: 400 });
  }
  try {
    const validated = await validatePhotoUploads(formData.getAll("photos"));
    if (!validated.ok) {
      return NextResponse.json({ ok: false, message: validated.message }, { status: 400 });
    }

    const uploads = await uploadPhotosToNotion(validated.photos);
    return NextResponse.json({ ok: true, uploads });
  } catch {
    console.error("Failed to upload Adventure Log photos");
    return NextResponse.json(
      { ok: false, message: "写真をアップロードできませんでした。もう一度試してください。" },
      { status: 500 },
    );
  }
}
