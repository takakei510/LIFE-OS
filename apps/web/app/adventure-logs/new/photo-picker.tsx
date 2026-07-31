"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

const MAX_PHOTO_COUNT = 5;
const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;
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

export function PhotoPicker() {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadedPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<SelectedPhoto[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

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
    const availableSlots = MAX_PHOTO_COUNT - photos.length;
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
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        errors.push(`${file.name}：1枚20MB以下にしてください。`);
        return;
      }
      accepted.push({ id: createPhotoId(file), file, previewUrl: URL.createObjectURL(file) });
    });

    if (files.length > availableSlots) errors.push(`写真は最大${MAX_PHOTO_COUNT}枚までです。`);
    if (accepted.length > 0) setPhotos((current) => [...current, ...accepted]);
    setError(errors.length > 0 ? errors.join(" ") : null);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
    setUploads([]);
    setError(null);
  }

  async function uploadPhotos() {
    if (photos.length === 0 || uploading) return;
    setUploading(true);
    setError(null);
    setUploads([]);

    const formData = new FormData();
    photos.forEach((photo) => formData.append("photos", photo.file, photo.file.name));

    try {
      const response = await fetch("/api/adventure-logs/photos", { method: "POST", body: formData });
      const result = await response.json() as UploadResponse;
      if (!response.ok || !result.ok) {
        setError(result.ok ? "写真をアップロードできませんでした。" : result.message);
        return;
      }
      setUploads(result.uploads);
    } catch (uploadError) {
      console.error("Failed to upload selected photos", uploadError);
      setError("写真をアップロードできませんでした。通信状態を確認してください。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="adventureLogPhotoField" aria-labelledby="adventure-log-photo-label">
      <div className="adventureLogPhotoHeader">
        <div>
          <span id="adventure-log-photo-label">写真 <small>任意</small></span>
          <p>JPEG・PNG・WebP／1枚20MB以下／最大5枚</p>
        </div>
        <span className="adventureLogPhotoCount">{photos.length}/{MAX_PHOTO_COUNT}</span>
      </div>

      <input ref={fileInputRef} className="adventureLogPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleSelection} />
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
          <button className="adventureLogPhotoButton" type="button" disabled={uploading} onClick={uploadPhotos}>
            {uploading ? "アップロード中…" : "写真をアップロード"}
          </button>
        </>
      ) : <p className="adventureLogPhotoEmpty">写真はまだ選択されていません。</p>}

      {uploads.length > 0 ? <p className="adventureLogPrivacy" role="status">{uploads.length}枚をNotionへアップロードしました。Adventure Logへの添付は次のPRで行います。</p> : null}
      <p className="adventureLogPrivacy">アップロード済みIDは一時的な結果です。このPRではMedia propertyへ添付しません。</p>
    </section>
  );
}
