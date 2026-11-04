"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { NeoButton } from "@/components/ui/neo-button";
import { changeQuestAction } from "@/app/actions/quest-actions";
import type { Quest } from "@/lib/notion/types";

function SubmitButton({ release }: { release: boolean }) {
  const { pending } = useFormStatus();
  return <NeoButton type="submit" variant={release ? "secondary" : "primary"} disabled={pending}>
    {pending ? "更新中…" : release ? "受注を取り消す" : "受注する"}
  </NeoButton>;
}

export function QuestControls({ quest, enabled, completionEnabled = false, compact = false }: { quest: Quest; enabled: boolean; completionEnabled?: boolean; compact?: boolean }) {
  const [result, action, pending] = useActionState(changeQuestAction, null);
  const [confirming, setConfirming] = useState(false);
  const confirmationId = useId();
  const router = useRouter();
  const release = quest.canRelease;
  const actionable = quest.canAccept || release;
  return (
    <section className={`questControls${compact ? " questControls--compact" : ""}`} aria-label={`${quest.name}の受注操作`}>
      {!compact ? <p>受注は任意です。取り消してもXPは減りません。</p> : null}
      {result ? <p role={result.ok ? "status" : "alert"}>{result.message}</p> : null}
      <fieldset className="questOperationFields" disabled={pending}>
      {enabled && actionable ? <form action={action}>
        <input type="hidden" name="questId" value={quest.id} />
        <input type="hidden" name="revision" value={quest.revision} />
        <input type="hidden" name="operation" value={release ? "release" : "accept"} />
        <SubmitButton release={release} />
      </form> : <p className="muted">{!enabled ? "Webからの受注は準備中です。" : quest.state === "Completed" ? "このクエストは完了しています。" : "現在の状態では受注できません。"}</p>}
      {enabled && completionEnabled && quest.canComplete ? <>
        <NeoButton variant="primary" aria-expanded={confirming} aria-controls={confirmationId} onClick={() => setConfirming(!confirming)}>達成を記録する</NeoButton>
        {confirming ? <form action={action} id={confirmationId} className="questCompletionConfirm">
          <input type="hidden" name="questId" value={quest.id} />
          <input type="hidden" name="revision" value={quest.revision} />
          <input type="hidden" name="operation" value="complete" />
          <p>{quest.completionCondition || "Notionに記載された達成条件を確認してください。"}</p>
          <p>達成報酬：{quest.rewardXp} XP。完了後はWebから取り消せません。実績の解除は別に選べます。</p>
          <label><input type="checkbox" name="confirmed" value="yes" required /> 条件を確認し、達成したと判断しました</label>
          <NeoButton type="submit" disabled={!quest.completionCondition}>{pending ? "記録中…" : "完了を確定する"}</NeoButton>
          <NeoButton variant="ghost" onClick={() => setConfirming(false)}>戻る</NeoButton>
        </form> : null}
      </> : null}
      </fieldset>
      {result && !result.ok ? <NeoButton variant="secondary" onClick={() => router.refresh()}>最新の状態を確認する</NeoButton> : null}
      {quest.state === "Completed" ? <div className="questCompletionResult">
        <p>{quest.earnedXp === null ? "報酬XPを集計中です。" : `獲得済み：${quest.earnedXp} XP`}</p>
        <Link href="/status">ステータスを見る →</Link>
        <NeoButton variant="ghost" onClick={() => router.refresh()}>集計を更新する</NeoButton>
      </div> : null}
      {!compact ? <p className="muted">クエストと実績は別々の報酬です。実績の解除は、ご自身で条件を確認して選べます。</p> : null}
    </section>
  );
}
