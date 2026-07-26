"use client";

import Link from "next/link";
import { ChangeEvent, useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { createAdventureLogAction } from "@/app/actions/adventure-log-actions";

const MAX_PHOTO_COUNT = 5;
const MAX_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type SelectedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="adventureLogSubmit" disabled={pending} type="submit">
      {pending ? "保存中…" : "思い出を保存"}
    </button>
  );
}

function toLocalDateTime(value?: string): string {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const offset = safeDate.getTimezoneOffset() * 60_000;
  return new Date(safeDate.getTime() - offset).toISOString().slice(0, 16);
}

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}

function createPhotoId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

export function AdventureLogForm({
  requestId,
  relatedAchievementId,
  achievementName,
  initialLoggedAt,
}: {
  requestId: string;
  relatedAchievementId?: string;
  achievementName?: string;
  initialLoggedAt?: string;
}) {
  const [state, action] = useActionState(createAdventureLogAction, null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
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

  function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const availableSlots = MAX_PHOTO_COUNT - photos.length;
    if (availableSlots <= 0) {
      setPhotoError(`写真は最大${MAX_PHOTO_COUNT}枚まで選べます。`);
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

      accepted.push({
        id: createPhotoId(file),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (files.length > availableSlots) {
      errors.push(`写真は最大${MAX_PHOTO_COUNT}枚までです。追加できる${availableSlots}枚だけ確認しました。`);
    }

    if (accepted.length > 0) {
      setPhotos((current) => [...current, ...accepted]);
    }

    setPhotoError(errors.length > 0 ? errors.join(" ") : null);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((photo) => photo.id !== id);
    });
    setPhotoError(null);
  }

  if (state?.ok) {
    return (
      <section className="adventureLogSuccess" aria-live="polite">
        <span aria-hidden="true">✨</span>
        <h2>冒険の思い出を保存しました</h2>
        <p>XPには影響しません。残したい瞬間だけ、これからも持ち帰れます。</p>
        <div>
          <Link href="/adventure-logs">冒険ログを見る</Link>
          <a href={state.url} target="_blank" rel="noreferrer">Notionで開く</a>
        </div>
      </section>
    );
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="adventureLogForm">
      <input name="requestId" type="hidden" value={requestId} />
      <input name="relatedAchievementId" type="hidden" value={relatedAchievementId ?? ""} />
      <input name="achievementName" type="hidden" value={achievementName ?? ""} />
      {errors?.form ? <p className="adventureLogFormError" role="alert">{errors.form}</p> : null}
      {state && !state.ok && !state.fieldErrors ? <p className="adventureLogFormError" role="alert">{state.message}</p> : null}

      {achievementName ? <p className="adventureLogPrivacy">関連実績：{achievementName}</p> : null}

      <label>
        <span>タイトル <small>任意</small></span>
        <input name="name" maxLength={120} placeholder="空欄なら実績名から自動生成します" />
        {errors?.name ? <em>{errors.name}</em> : null}
      </label>

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
          onChange={handlePhotoSelection}
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

        {photoError ? <p className="adventureLogFormError" role="alert">{photoError}</p> : null}

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
          <p className="adventureLogPhotoEmpty">写真なしでも保存できます。残したい瞬間だけ追加してください。</p>
        )}
      </section>

      <label>
        <span>一言メモ <small>任意</small></span>
        <textarea name="memo" maxLength={2000} rows={6} placeholder="何が心に残った？ 一言だけでも十分です。" />
        {errors?.memo ? <em>{errors.memo}</em> : null}
      </label>

      <label>
        <span>場所 <small>任意</small></span>
        <input name="location" maxLength={200} placeholder="例：大学の図書館、水戸駅付近" />
        {errors?.location ? <em>{errors.location}</em> : null}
      </label>

      <label>
        <span>体験した日時</span>
        <input name="loggedAt" type="datetime-local" defaultValue={toLocalDateTime(initialLoggedAt)} />
        {errors?.loggedAt ? <em>{errors.loggedAt}</em> : null}
      </label>

      <div className="adventureLogFormActions">
        <SubmitButton />
        <Link href={relatedAchievementId ? `/achievements/${relatedAchievementId}` : "/adventure-logs"}>今回は残さない</Link>
      </div>
      <p className="adventureLogPrivacy">作成時はPrivateで保存され、ログ作成によるXP付与はありません。写真は次の実装段階でNotionへ保存します。</p>
    </form>
  );
}
