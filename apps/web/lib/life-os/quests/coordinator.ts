export interface QuestLockStore {
  claim(key: string): Promise<string | null>;
  release(key: string, etag: string): Promise<void>;
}

export type QuestCoordinator = <T>(key: string, work: (markWriteStarted: () => void) => Promise<T>) => Promise<T>;

// No time-based lock expiry: a timed-out Notion request may still commit later.
// Keep uncertain writes fenced until an operator checks the Notion record.
export function createQuestCoordinator(store: QuestLockStore): QuestCoordinator {
  return async (key, work) => {
    const etag = await store.claim(key);
    if (!etag) throw new Error("このクエストの更新を確認中です。しばらくしてから最新の状態を確認してください。");
    let writeStarted = false;
    let success = false;
    try {
      const result = await work(() => { writeStarted = true; });
      success = true;
      return result;
    } finally {
      if (success || !writeStarted) {
        try { await store.release(key, etag); } catch { /* Keep the fence; never undo a confirmed Notion write. */ }
      }
    }
  };
}
