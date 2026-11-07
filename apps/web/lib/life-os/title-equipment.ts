export function titleId(value: string): string {
  return value.replaceAll("-", "").toLowerCase();
}

export function planTitleEquipment(
  equipped: string[],
  expected: string[],
  target: string,
  operation: "equip" | "unequip",
): { id: string; equipped: boolean }[] {
  const targetKey = titleId(target);
  const current = equipped.map(titleId).sort();
  if (operation === "equip" && current.length === 1 && current[0] === targetKey) return [];
  if (operation === "unequip" && !current.includes(targetKey)) return [];
  const snapshot = expected.map(titleId).sort();
  if (current.length !== snapshot.length || current.some((id, index) => id !== snapshot[index])) {
    throw new Error("STALE_TITLE_EQUIPMENT");
  }
  if (operation === "unequip") return [{ id: target, equipped: false }];
  const changes = equipped.filter(id => titleId(id) !== targetKey).map(id => ({ id, equipped: false }));
  if (!current.includes(targetKey)) changes.push({ id: target, equipped: true });
  return changes;
}
