"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { unlockAchievementAction } from "@/app/actions/achievement-actions";

function UnlockButton() {
  const { pending } = useFormStatus();
  return (
    <button className="achievementUnlockButton" disabled={pending} type="submit">
      {pending ? "解除中…" : "実績を解除する"}
    </button>
  );
}

export function UnlockAchievement({ achievementId, achievementName }: { achievementId: string; achievementName: string }) {
  const [state, action] = useActionState(unlockAchievementAction, null);

  if (state?.ok) {
    const params = new URLSearchParams({
      achievementId,
      achievementName,
      loggedAt: state.unlockedAt,
    });
    return (
      <section className="achievementUnlockSuccess" aria-live="polite">
        <p className="eyebrow">ACHIEVEMENT UNLOCKED</p>
        <h2>実績を解除しました</h2>
        <p>この冒険の思い出を残しますか？ 一言や場所はすべて任意です。</p>
        <div>
          <Link className="achievementLogButton" href={`/adventure-logs/new?${params.toString()}`}>
            思い出を残す
          </Link>
          <Link className="achievementSkipButton" href="/achievements">今回は残さない</Link>
        </div>
      </section>
    );
  }

  return (
    <form action={action} className="achievementUnlockForm">
      <input name="achievementId" type="hidden" value={achievementId} />
      {state && !state.ok ? <p className="achievementUnlockError" role="alert">{state.message}</p> : null}
      <p>達成条件を満たしたら、ここから解除できます。冒険ログは解除後に任意で残せます。</p>
      <UnlockButton />
    </form>
  );
}
