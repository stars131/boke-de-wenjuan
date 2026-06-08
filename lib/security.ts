import crypto from "crypto";

const CIPHER = "aes-256-gcm";

function getHashSecret() {
  return process.env.HASH_SECRET || process.env.NEXTAUTH_SECRET || "local-development-hash-secret";
}

function getEncryptionKey() {
  const raw = process.env.CONTACT_ENCRYPTION_KEY;

  if (raw) {
    try {
      const decoded = Buffer.from(raw, "base64");
      if (decoded.length === 32) {
        return decoded;
      }
    } catch {
      // Fall through to deterministic development key derivation.
    }
  }

  const fallback = process.env.NEXTAUTH_SECRET || "local-development-contact-key";
  return crypto.createHash("sha256").update(fallback).digest();
}

export function hashValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return crypto.createHmac("sha256", getHashSecret()).update(value).digest("hex");
}

export function encryptContactInfo(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(CIPHER, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptContactInfo(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Invalid encrypted contact value");
  }

  const decipher = crypto.createDecipheriv(CIPHER, getEncryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export function hashContactInfo(value: string) {
  return hashValue(value.trim().toLowerCase());
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function getRequestUserAgent(request: Request) {
  return request.headers.get("user-agent") || "unknown";
}
