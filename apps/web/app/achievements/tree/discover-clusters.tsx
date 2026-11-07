"use client";

import { useActionState } from "react";
import { discoverClustersAction } from "@/app/actions/achievement-actions";
import { NeoButton } from "@/components/ui/neo-button";

export function DiscoverClusters() {
  const [error, action, pending] = useActionState(discoverClustersAction, null);
  return (
    <form action={action}>
      <NeoButton type="submit" disabled={pending}>
        {pending ? "発見を保存中…" : "新しいつながりを見つける"}
      </NeoButton>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
