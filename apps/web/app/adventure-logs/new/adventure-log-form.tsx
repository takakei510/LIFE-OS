"use client";

import Link from "next/link";
import { achievementPresentation } from "@/components/life-icons/presentation";
import { NeoButton } from "@/components/ui/neo-button";
import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";
import { createAdventureLogAction } from "@/app/actions/adventure-log-actions";
import { PhotoPicker, type PhotoPickerState } from "./photo-picker";
import { toJstLocalDateTime } from "@/lib/life-os/adventure-logs/date-time";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <NeoButton className="adventureLogSubmit" disabled={pending || disabled} type="submit">{pending ? "保存中…" : "保存する"}</NeoButton>;
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
  const [fields, setFields] = useState({ name: "", memo: "", location: "", loggedAt: toJstLocalDateTime(initialLoggedAt) });
  const [photoState, setPhotoState] = useState<PhotoPickerState>({ grant: "", count: 0, ready: true, busy: false });
  const handlePhotoState = useCallback((next: PhotoPickerState) => setPhotoState(next), []);

  if (state?.ok) {
    return (
      <section className="adventureLogSuccess" aria-live="polite">
        <h2>冒険の思い出を保存しました</h2>
        <p>ログ作成によるXP付与はありません。</p>
        <div><Link href="/adventure-logs">冒険ログを見る</Link><a href={state.url} target="_blank" rel="noreferrer">Notionで開く</a></div>
      </section>
    );
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const skipHref = relatedAchievementId ? `/achievements/${relatedAchievementId}` : "/adventure-logs";

  return (
    <form action={action} className="adventureLogForm">
      <input name="requestId" type="hidden" value={requestId} />
      <input name="relatedAchievementId" type="hidden" value={relatedAchievementId ?? ""} />
      <input name="achievementName" type="hidden" value={achievementName ?? ""} />
      <input name="photoGrant" type="hidden" value={photoState.count ? photoState.grant : ""} />
      {state && !state.ok ? <p className="adventureLogFormError" role="alert">{state.message}</p> : null}
      {achievementName ? <p className="adventureLogPrivacy">Related Achievement：{achievementPresentation({ id: relatedAchievementId ?? "", name: achievementName, domains: [] }).name}</p> : null}
      <label><span>タイトル <small>任意</small></span><input name="name" maxLength={120} value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} />{errors?.name ? <em>{errors.name}</em> : null}</label>
      <PhotoPicker requestId={requestId} onStateChange={handlePhotoState} />
      {photoState.count > 0 && !photoState.ready ? <p role="status">写真をアップロードしてから保存してください。写真を削除してテキストだけでも保存できます。</p> : null}
      <label><span>Memo <small>任意</small></span><textarea name="memo" maxLength={2000} rows={6} value={fields.memo} onChange={(event) => setFields({ ...fields, memo: event.target.value })} />{errors?.memo ? <em>{errors.memo}</em> : null}</label>
      <label><span>Location <small>任意</small></span><input name="location" maxLength={200} value={fields.location} onChange={(event) => setFields({ ...fields, location: event.target.value })} />{errors?.location ? <em>{errors.location}</em> : null}</label>
      <label><span>Logged At（日本時間） <small>任意</small></span><input name="loggedAt" type="datetime-local" value={fields.loggedAt} onChange={(event) => setFields({ ...fields, loggedAt: event.target.value })} />{errors?.loggedAt ? <em>{errors.loggedAt}</em> : null}</label>
      <div className="adventureLogFormActions"><SubmitButton disabled={photoState.busy || !photoState.ready} /><Link href={skipHref}>今回は残さない</Link></div>
      {state && !state.ok && state.textSaved && state.url ? <p><a href={state.url} target="_blank" rel="noreferrer">保存された思い出をNotionで確認する</a></p> : null}
      <p className="adventureLogPrivacy">すべて任意です。作成時はPrivate / Activeで保存されます。</p>
    </form>
  );
}
