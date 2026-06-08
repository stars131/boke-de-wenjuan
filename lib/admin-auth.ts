import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";

export type AdminSession = {
  username: string;
  role: "admin" | "superadmin";
  expiresAt: number;
};

export const ADMIN_SESSION_COOKIE = "university_podcast_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.NEXTAUTH_SECRET || "local-development-nextauth-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createAdminSession(username: string) {
  const session: AdminSession = {
    username,
    role: process.env.ADMIN_IS_SUPER === "true" ? "superadmin" : "admin",
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000
  };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token: string | undefined): AdminSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== sign(payload)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (session.expiresAt <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getAdminSessionFromCookies() {
  return verifyAdminSession(cookies().get(ADMIN_SESSION_COOKIE)?.value);
}

export async function verifyAdminCredentials(username: string, password: string) {
  const configuredUsername = process.env.ADMIN_USERNAME || "admin";
  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (username !== configuredUsername) {
    return false;
  }

  if (hash && !hash.startsWith("replace-with")) {
    return bcrypt.compare(password, hash);
  }

  if (process.env.NODE_ENV !== "production") {
    return password === (process.env.ADMIN_DEV_PASSWORD || "admin123");
  }

  return false;
}

export function requireAdminSession() {
  const session = getAdminSessionFromCookies();

  if (!session) {
    return null;
  }

  return session;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const expected = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    return new URL(origin).host === new URL(expected).host;
  } catch {
    return false;
  }
}
