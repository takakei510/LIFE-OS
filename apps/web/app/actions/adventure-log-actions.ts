"use server";

import { revalidatePath } from "next/cache";

import { createAdventureLog } from "@/lib/life-os/adventure-logs/service";
import type { CreateAdventureLogResult } from "@/lib/life-os/adventure-logs/types";

export type AdventureLogFormState = CreateAdventureLogResult | null;

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function createAdventureLogAction(
  _previousState: AdventureLogFormState,
  formData: FormData,
): Promise<AdventureLogFormState> {
  const result = await createAdventureLog({
    requestId: value(formData, "requestId"),
    name: value(formData, "name"),
    memo: value(formData, "memo"),
    location: value(formData, "location"),
    loggedAt: value(formData, "loggedAt"),
  });

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/adventure-logs");
  }
  return result;
}
