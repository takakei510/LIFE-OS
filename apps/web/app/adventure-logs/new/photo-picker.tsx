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

    if (files.length > availableSlots) {
      errors.push(`写真は最大${MAX_PHOTO_COUNT}枚までです。`);
    }
    if (accepted.length > 0) {
      setPhotos((current) => [...current, ...accepted]);
    }
    setError(errors.length > 0 ? errors.join(" ") : null);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
    setError(null);
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

      <input
        ref={fileInputRef}
        className="adventureLogPhotoInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleSelection}
      />
      <button
        className="adventureLogPhotoButton"
        type="button"
        disabled={photos.length >= MAX_PHOTO_COUNT}
        onClick={() => fileInputRef.current?.click()}
      >
        <span aria-hidden="true">📷</span>
        {photos.length === 0 ? "写真を選ぶ" : "写真を追加する"}
      </button>

      {error ? <p className="adventureLogFormError" role="alert">{error}</p> : null}

      {photos.length > 0 ? (
        <ul className="adventureLogPhotoGrid" aria-label="選択した写真">
          {photos.map((photo, index) => (
            <li key={photo.id} className="adventureLogPhotoCard">
              <img src={photo.previewUrl} alt={`選択した写真 ${index + 1}`} />
              <div>
                <strong title={photo.file.name}>{photo.file.name}</strong>
                <span>{formatFileSize(photo.file.size)}</span>
              </div>
              <button type="button" onClick={() => removePhoto(photo.id)} aria-label={`${photo.file.name}を削除`}>
                削除
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="adventureLogPhotoEmpty">写真はまだ選択されていません。</p>
      )}
      <p className="adventureLogPrivacy">このPRでは写真を選択・確認するだけで、アップロードやNotion保存は行いません。</p>
    </section>
  );
}
