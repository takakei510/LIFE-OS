"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { MAX_PHOTO_COUNT, MAX_PHOTO_SIZE_BYTES, validatePhotoMetadata } from "@/lib/life-os/adventure-logs/photo-policy";

const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SelectedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type UploadedPhoto = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
};

type UploadResponse =
  | { ok: true; uploads: UploadedPhoto[] }
  | { ok: false; message: string };

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function createPhotoId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

export type PhotoPickerState = { grant: string; count: number; ready: boolean; busy: boolean };
type PreparedBatch = { grant: string; uploads: { pathname: string; token: string }[]; staged: Set<number>; results: Map<number, UploadedPhoto> };

export function PhotoPicker({ requestId, onStateChange }: { requestId: string; onStateChange?: (state: PhotoPickerState) => void }) {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadedPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<SelectedPhoto[]>([]);
  const batchRef = useRef<PreparedBatch | null>(null);

  useEffect(() => {
    onStateChange?.({ grant: batchRef.current?.grant ?? "", count: photos.length, ready: photos.length === uploads.length, busy: uploading });
  }, [photos.length, uploads.length, uploading, onStateChange]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

  function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setUploads([]);
    batchRef.current = null;
    const availableSlots = MAX_PHOTO_COUNT - photosRef.current.length;
    if (availableSlots <= 0) {
      setError(`写真は最大${MAX_PHOTO_COUNT}枚まで選べます。`);
      return;
    }

    const accepted: SelectedPhoto[] = [];
    const errors: string[] = [];

    files.slice(0, availableSlots).forEach((file) => {
      if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
        errors.push(`${file.name}：JPEG・PNG・WebPのみ選べます。`);
        return;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES || !validatePhotoMetadata({ filename: file.name, contentType: file.type, size: file.size })) {
        errors.push(`${file.name}：JPEG・PNG・WebPの空でない画像、1枚5MiB以下にしてください。`);
        return;
      }
      accepted.push({ id: createPhotoId(file), file, previewUrl: URL.createObjectURL(file) });
    });

    if (files.length > availableSlots) errors.push(`写真は最大${MAX_PHOTO_COUNT}枚までです。`);
    if (accepted.length > 0) {
      photosRef.current = [...photosRef.current, ...accepted];
      setPhotos(photosRef.current);
    }
    setError(errors.length > 0 ? errors.join(" ") : null);
  }

  function removePhoto(id: string) {
    const target = photosRef.current.find((photo) => photo.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    photosRef.current = photosRef.current.filter((photo) => photo.id !== id);
    setPhotos(photosRef.current);
    setUploads([]);
    batchRef.current = null;
    setError(null);
  }

  async function uploadPhotos() {
    if (photos.length === 0 || uploading) return;
    setUploading(true);
    setError(null);
    setUploads([]);

    try {
      const { put } = await import("@vercel/blob/client");
      async function call(body: object) {
        const response = await fetch("/api/adventure-logs/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.message ?? "写真を保存できませんでした。");
        return result;
      }
      if (!batchRef.current) {
        const prepared = await call({ operation: "prepare", requestId, photos: photos.map(({ file }) => ({ filename: file.name, contentType: file.type, size: file.size })) });
        batchRef.current = { grant: prepared.grant, uploads: prepared.uploads, staged: new Set(), results: new Map() };
      }
      const batch = batchRef.current;
      for (let index = 0; index < photos.length; index++) {
        if (batch.results.has(index)) continue;
        if (!batch.staged.has(index)) {
          const file = photos[index].file;
          const target = batch.uploads[index];
          try {
            await put(target.pathname, file, { access: "private", token: target.token, contentType: file.type });
            batch.staged.add(index);
          } catch {
            // A lost response may mean the immutable object already exists. The
            // server checks its actual content and rejects absent/invalid data.
          }
        }
        const result = await call({ operation: "finalize", grant: batch.grant, index });
        batch.results.set(index, result.upload);
        setUploads(Array.from(batch.results.values()));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "写真を保存できませんでした。通信状態を確認してください。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="adventureLogPhotoField" aria-labelledby="adventure-log-photo-label">
      <div className="adventureLogPhotoHeader">
        <div>
          <span id="adventure-log-photo-label">写真 <small>任意</small></span>
          <p>JPEG・PNG・WebP／1枚5MiB以下／最大5枚（Notion無料プラン）</p>
        </div>
        <span className="adventureLogPhotoCount">{photos.length}/{MAX_PHOTO_COUNT}</span>
      </div>

      <input ref={fileInputRef} disabled={uploading} className="adventureLogPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleSelection} />
      <button className="adventureLogPhotoButton" type="button" disabled={photos.length >= MAX_PHOTO_COUNT || uploading} onClick={() => fileInputRef.current?.click()}>
        <span aria-hidden="true">📷</span>{photos.length === 0 ? "写真を選ぶ" : "写真を追加する"}
      </button>

      {error ? <p className="adventureLogFormError" role="alert">{error}</p> : null}

      {photos.length > 0 ? (
        <>
          <ul className="adventureLogPhotoGrid" aria-label="選択した写真">
            {photos.map((photo, index) => (
              <li key={photo.id} className="adventureLogPhotoCard">
                <img src={photo.previewUrl} alt={`選択した写真 ${index + 1}`} />
                <div><strong title={photo.file.name}>{photo.file.name}</strong><span>{formatFileSize(photo.file.size)}</span></div>
                <button type="button" disabled={uploading} onClick={() => removePhoto(photo.id)} aria-label={`${photo.file.name}を削除`}>削除</button>
              </li>
            ))}
          </ul>
          <button className="adventureLogPhotoButton" type="button" disabled={uploading || uploads.length === photos.length} onClick={uploadPhotos}>
            {uploading ? "アップロード中…" : uploads.length === photos.length ? "写真の準備ができました" : "写真をアップロード"}
          </button>
        </>
      ) : <p className="adventureLogPhotoEmpty">写真はまだ選択されていません。</p>}

      {uploads.length > 0 ? <p className="adventureLogPrivacy" role="status">{uploads.length}枚をNotionへアップロードしました。Adventure Logへの添付は次のPRで行います。</p> : null}
      <p className="adventureLogPrivacy">元画像を保存します。写真には位置情報などの個人情報が含まれる場合があります。</p>
    </section>
  );
}
