export type TransferResult = { id: string; filename: string; contentType: string; size: number };
export type TransferState = { status: "pending" } | { status: "complete"; result: TransferResult };

// The store's create operation must be atomic. Never retry an ambiguous Notion write.
export async function transferPhotoOnce(deps: {
  read(): Promise<TransferState | null>;
  claim(): Promise<string | null>;
  upload(): Promise<TransferResult>;
  releaseInvalid?(claim: string): Promise<void>;
  complete(claim: string, result: TransferResult): Promise<void>;
  cleanup(): Promise<void>;
}): Promise<TransferResult> {
  const existing = await deps.read();
  if (existing?.status === "complete") {
    await deps.cleanup();
    return existing.result;
  }
  if (existing) throw new Error("TRANSFER_PENDING");
  const claim = await deps.claim();
  if (!claim) throw new Error("TRANSFER_PENDING");
  let result: TransferResult;
  try { result = await deps.upload(); } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PHOTO") await deps.releaseInvalid?.(claim);
    throw error;
  }
  await deps.complete(claim, result);
  await deps.cleanup();
  return result;
}
