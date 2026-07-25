"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createAdventureLogAction } from "@/app/actions/adventure-log-actions";

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
      <p className="adventureLogPrivacy">作成時はPrivateで保存され、ログ作成によるXP付与はありません。</p>
    </form>
  );
}
