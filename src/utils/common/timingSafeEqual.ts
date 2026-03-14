import crypto from "crypto";

export function timingSafeEqual(provided: string, stored: string): boolean {
  const providedBuf = Buffer.from(provided);
  const storedBuf = Buffer.from(stored);

  if (providedBuf.length !== storedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, storedBuf);
}
