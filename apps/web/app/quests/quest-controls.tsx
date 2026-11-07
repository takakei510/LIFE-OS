"use client";

import { useActionState } from "react";
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

export function QuestControls({ quest, enabled, compact = false }: { quest: Quest; enabled: boolean; compact?: boolean }) {
  const [result, action] = useActionState(changeQuestAction, null);
  const router = useRouter();
  const release = quest.canRelease;
  const actionable = quest.canAccept || release;
  return (
    <section className={`questControls${compact ? " questControls--compact" : ""}`} aria-label={`${quest.name}の受注操作`}>
      {!compact ? <p>受注は任意です。取り消してもXPは減りません。</p> : null}
      {result ? <p role={result.ok ? "status" : "alert"}>{result.message}</p> : null}
      {enabled && actionable ? <form action={action}>
        <input type="hidden" name="questId" value={quest.id} />
        <input type="hidden" name="revision" value={quest.revision} />
        <input type="hidden" name="operation" value={release ? "release" : "accept"} />
        <SubmitButton release={release} />
      </form> : <p className="muted">{!enabled ? "Webからの受注は準備中です。" : quest.state === "Completed" ? "このクエストは完了しています。" : "現在の状態では受注できません。"}</p>}
      {result && !result.ok ? <NeoButton variant="secondary" onClick={() => router.refresh()}>最新の状態を確認する</NeoButton> : null}
      {!compact ? <p className="muted">達成の記録はNotionで行えます。実績の解除は、ご自身で条件を確認して選べます。</p> : null}
    </section>
  );
}
