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
    {pending ? "更新中…" : release ? "受注を取り消す" : "このクエストを受注する"}
  </NeoButton>;
}

export function QuestControls({ quest, enabled }: { quest: Quest; enabled: boolean }) {
  const [result, action] = useActionState(changeQuestAction, null);
  const router = useRouter();
  const release = quest.canRelease;
  const actionable = quest.canAccept || release;
  return (
    <section className="questControls" aria-label="受注操作">
      <p>受注は任意です。取り消してもXPは減りません。</p>
      {result ? <p role={result.ok ? "status" : "alert"}>{result.message}</p> : null}
      {enabled && actionable ? <form action={action}>
        <input type="hidden" name="questId" value={quest.id} />
        <input type="hidden" name="revision" value={quest.revision} />
        <input type="hidden" name="operation" value={release ? "release" : "accept"} />
        <SubmitButton release={release} />
      </form> : <p className="muted">{!enabled ? "Webからの受注は準備中です。" : quest.state === "Completed" ? "このクエストは完了しています。" : "現在の状態では受注できません。"}</p>}
      {result && !result.ok ? <NeoButton variant="secondary" onClick={() => router.refresh()}>最新の状態を確認する</NeoButton> : null}
      <p className="muted">今回は受注・取り消しに対応しています。達成・報酬は変更しません。</p>
    </section>
  );
}
