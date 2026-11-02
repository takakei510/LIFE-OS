# Original photo upload — proposal, 2026-11-02

Status: awaiting approval of external storage setup. Not implemented or deployed.

## Confirmed state

- main: `14e8a680310b8ec70f62221c4c819447e15a5133`; #39–#42 merged.
- #43 remains Draft. Original head `4637dfd` passed Actions run 123, including typecheck and production build.
- #34 remains Draft; do not merge its mixed implementation or close before replacement work is verified.
- Vercel project `life-os-web-m3ds` has a READY production deployment for current main. Authenticated HOME fetch returns 200 with game data. This does not prove write flows.
- Vercel protection is configured as `all_except_custom_domains`; no application authentication exists in the repository. Keep the protected deployment boundary and verify anonymous denial for every upload endpoint before release. Do not add an unprotected domain.
- README still describes v0.3.0; ROADMAP photo picker checkboxes are stale. Update both in the release documentation PR after integration.

## Problem and decision

The existing multipart route receives up to five 20 MiB files in one request. Vercel Functions accept at most 4.5 MB per request, so this cannot satisfy the advertised limit. The user chose to preserve original images rather than resize them or lower the limit.

Proposed temporary transport: a dedicated **private Vercel Blob store**, browser direct upload, then server-to-server transfer to Notion. No permanent media URLs or game records live in Blob. Notion remains the single source of truth.

## Required flow

1. Authenticate the player before issuing upload authorization. Same-origin checks are additional CSRF protection, not authentication.
2. Authorize a batch with a server-generated batch ID and a maximum of five server-assigned object paths. Sign owner, expiry, count, filename, size and MIME into the upload grant; client metadata alone is not trusted. Enforce per-object size and exact path at token issuance. Do not expose the store credential.
3. Upload the unmodified original directly into private storage. No image bytes pass through the browser-facing Function.
4. Finalize using only the signed batch grant and approved object paths. Read from the dedicated store via its SDK; never fetch an arbitrary client URL. Recheck ownership, expiry, count, actual size, extension, MIME, signature and image decodability with a bounded pixel budget. Signatures alone do not establish that an image is valid or safe.
5. Transfer validated bytes to Notion using the existing repository adapter. Process one file at a time with bounded memory and timeouts. Check Notion workspace upload capacity (Free: 5 MiB; paid: larger). Do not silently downscale a 20 MiB original.
6. Return ordered upload receipts bound to the player, batch and expiry. Prevent duplicate finalization with a durable per-batch claim/result. Select its storage mechanism before implementation; process-local memory is insufficient.
7. Delete staging bytes after successful transfer; surface cleanup failures for retry. Expire abandoned batches and remove their objects within 24 hours using a scheduled cleanup. The cleanup must be scoped to the dedicated store and temporary prefix.
8. Media Attach remains a separate change: validate receipts server-side, attach to the newly created log only, handle retries without duplicate attachments, preserve text log creation when photo attachment fails. Never accept arbitrary File Upload IDs from hidden inputs.

## Failure and privacy rules

- Original bytes and metadata (including possible EXIF location) are preserved; inform the player before upload.
- Keep file names, signed URLs, credentials and photo data out of logs.
- On partial upload failure, retain completed receipts and retry only failed files. Distinguish retryable failure from expired uploads.
- Notion uploads must be attached within the API expiry window; re-upload expired originals on explicit retry rather than claiming success.
- User cancellation creates no Adventure Log. Unattached uploads are temporary and subject to expiry.

## Service setup and cost approval

Proposed resource: one private staging Blob store for project `life-os-web-m3ds` in the existing Vercel team. Do not provision it until approved. Use separate preview/production credentials or stores, least privilege, and no secret retrieval into chat.

Blob charges depend on plan, stored volume, read operations and transfer. Hobby has included limits and stops service when exhausted; Pro can charge for usage. No paid plan change is proposed. Confirm the current plan, budget and alert threshold before provisioning. A temporary 5 × 20 MiB batch is about 100 MiB before cleanup, with additional server download traffic to transfer into Notion.

## MVP acceptance and delivery order

1. Upload API: secure original transport, boundary tests for count/size/type/spoofing, owner isolation, expired grants, replay, partial failures and cleanup. Typecheck/build pass. Validate with mocked providers; no permanent test records in production Notion.
2. Media Attach: separate Draft PR depending on #43; Blocks: Photo Display. Verify creation, retry and attachment failure recovery with an isolated mock repository.
3. Photo Display: separate Draft PR depending on Media Attach; Blocks: MVP release. HOME and list use normalized repository media, refresh expired Notion URLs, and handle missing/broken media on mobile.
4. Integration/release: phone/browser selection → original upload → optional text save → attachment → reload → photo display. Also verify skip, text-only, no duplicate retry, no XP for logging and existing achievements/search navigation.
5. Initial setup: document required Notion data source properties/permissions, private deployment access, environment variable names, upload quota and recovery steps. Check configuration without modifying existing Notion data.
6. Release: human review/merge under repository workflow, production deployment for the reviewed commit, read-only smoke tests, rollback reference. Resolve outstanding dependency advisories before publishing new writes. Do not mark MVP complete based only on a successful build.

Quest acceptance/completion and title equipment remain separate roadmap features; do not silently include new Notion state changes in the photo PRs. Confirm whether those are required for the first daily-use release after the photo path is validated.

## References

- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/vercel-blob/client-upload
- https://vercel.com/docs/vercel-blob/using-blob-sdk
- https://vercel.com/docs/vercel-blob/usage-and-pricing
- https://developers.notion.com/guides/data-apis/working-with-files-and-media
