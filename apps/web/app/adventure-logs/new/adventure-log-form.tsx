"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createAdventureLogAction } from "@/app/actions/adventure-log-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="adventureLogSubmit" disabled={pending} type="submit">{pending ? "保存中…" : "保存する"}</button>;
}

function toLocalDateTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
      {state && !state.ok ? <p className="adventureLogFormError" role="alert">{state.message}</p> : null}
      {achievementName ? <p className="adventureLogPrivacy">Related Achievement：{achievementName}</p> : null}
      <label><span>タイトル <small>任意</small></span><input name="name" maxLength={120} />{errors?.name ? <em>{errors.name}</em> : null}</label>
      <label><span>Memo <small>任意</small></span><textarea name="memo" maxLength={2000} rows={6} />{errors?.memo ? <em>{errors.memo}</em> : null}</label>
      <label><span>Location <small>任意</small></span><input name="location" maxLength={200} />{errors?.location ? <em>{errors.location}</em> : null}</label>
      <label><span>Logged At <small>任意</small></span><input name="loggedAt" type="datetime-local" defaultValue={toLocalDateTime(initialLoggedAt)} />{errors?.loggedAt ? <em>{errors.loggedAt}</em> : null}</label>
      <div className="adventureLogFormActions"><SubmitButton /><Link href={skipHref}>今回は残さない</Link></div>
      <p className="adventureLogPrivacy">すべて任意です。作成時はPrivate / Activeで保存されます。</p>
    </form>
  );
}
