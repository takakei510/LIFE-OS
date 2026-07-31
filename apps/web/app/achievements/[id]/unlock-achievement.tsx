"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { unlockAchievementAction } from "@/app/actions/achievement-actions";

function UnlockButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} type="submit">{pending ? "解除中…" : "実績を解除する"}</button>;
}

export function UnlockAchievement({ achievementId, achievementName }: { achievementId: string; achievementName: string }) {
  const [state, action] = useActionState(unlockAchievementAction, null);
  if (state?.ok) {
    const params = new URLSearchParams({ achievementId, achievementName, loggedAt: state.unlockedAt });
    return (
      <section className="achievementUnlockSuccess" aria-live="polite">
        <h2>実績を解除しました</h2>
        <p>この冒険の思い出を残しますか？ 入力はすべて任意です。</p>
        <div>
          <Link href={`/adventure-logs/new?${params.toString()}`}>保存する</Link>
          <Link href="/achievements">今回は残さない</Link>
        </div>
      </section>
    );
  }
  return (
    <form action={action} className="achievementUnlockForm">
      <input name="achievementId" type="hidden" value={achievementId} />
      {state && !state.ok ? <p role="alert">{state.message}</p> : null}
      <p>冒険ログを作成しなくても実績解除は正常に完了します。</p>
      <UnlockButton />
    </form>
  );
}
