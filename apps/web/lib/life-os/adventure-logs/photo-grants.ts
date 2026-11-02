import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const photoOwnerDigest = (owner: string) => createHash("sha256").update(owner).digest("hex");

export type PhotoGrant = {
  version: 1;
  batchId: string;
  owner: string;
  requestId: string;
  expiresAt: number;
  photos: { filename: string; contentType: string; size: number; pathname: string }[];
};

export function signPhotoGrant(grant: PhotoGrant, secret: string): string {
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(`life-os-photo-v1:${payload}`).digest("base64url")}`;
}

export function verifyPhotoGrant(token: string, owner: string, secret: string, now = Date.now()): PhotoGrant {
  if (token.length > 10000) throw new Error("Invalid grant");
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) throw new Error("Invalid grant");
  const expected = createHmac("sha256", secret).update(`life-os-photo-v1:${payload}`).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Invalid grant");
  const grant = JSON.parse(Buffer.from(payload, "base64url").toString()) as PhotoGrant;
  if (grant.version !== 1 || grant.owner !== photoOwnerDigest(owner) || !owner || grant.expiresAt <= now || !Array.isArray(grant.photos) || grant.photos.length < 1 || grant.photos.length > 5) throw new Error("Expired or invalid grant");
  return grant;
}
