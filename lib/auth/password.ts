import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_SCHEME = "s2";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${PASSWORD_SCHEME}:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split(":");

  if (scheme !== PASSWORD_SCHEME || !salt || !hash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(hash, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
