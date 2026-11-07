"use server";

import { revalidatePath } from "next/cache";
import { changeTitleEquipment } from "@/lib/notion/repositories/title-equipment";

export type TitleEquipmentState = { ok: boolean; message: string } | null;
const uuid = /^(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i;

export async function titleEquipmentAction(_previous: TitleEquipmentState, data: FormData): Promise<TitleEquipmentState> {
  const id = data.get("titleId");
  const operation = data.get("operation");
  const expected = data.getAll("equippedId");
  if (typeof id !== "string" || !uuid.test(id) || (operation !== "equip" && operation !== "unequip")
    || !expected.every((value): value is string => typeof value === "string" && uuid.test(value))) {
    return { ok: false, message: "称号を確認できませんでした。" };
  }

  try {
    await changeTitleEquipment(id, operation, expected);
    return { ok: true, message: operation === "equip" ? "称号を装備しました。" : "称号を外しました。" };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "STALE_TITLE_EQUIPMENT") return { ok: false, message: "装備が変更されています。最新の一覧から選び直してください。" };
    if (code === "INVALID_TITLE") return { ok: false, message: "取得済みの称号を選んでください。" };
    return { ok: false, message: "装備の更新を確認できませんでした。最新の装備状態をご確認ください。" };
  } finally {
    revalidatePath("/titles");
    revalidatePath("/");
    revalidatePath("/status");
  }
}
