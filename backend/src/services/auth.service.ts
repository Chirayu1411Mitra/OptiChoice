import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { createSession, deleteSession, findUserForSession, type AuthUser } from "../repositories/user.repository.js";

const SCRYPT_N = 2 ** 15;
const SCRYPT_R = 8;
const SCRYPT_P = 3;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

async function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    nodeScrypt(password, salt, KEY_LENGTH, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: MAX_MEMORY,
    }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derivePassword(password, salt);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, saltText, keyText] = stored.split("$");
  if (algorithm !== "scrypt" || n !== String(SCRYPT_N) || r !== String(SCRYPT_R) || p !== String(SCRYPT_P) || !saltText || !keyText) return false;
  const salt = Buffer.from(saltText, "base64url");
  const expected = Buffer.from(keyText, "base64url");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await derivePassword(password, salt);
  return timingSafeEqual(actual, expected);
}

export function tokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function issueSession(userId: string): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString("base64url");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_LIFETIME_MS).toISOString();
  createSession(tokenDigest(token), userId, createdAt.toISOString(), expiresAt);
  return { token, expiresAt };
}

export function authenticateSession(token: string): AuthUser | null {
  return findUserForSession(tokenDigest(token), new Date().toISOString());
}

export function revokeSession(token: string): void {
  deleteSession(tokenDigest(token));
}
