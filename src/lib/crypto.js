import crypto from "node:crypto";
import { appEnv } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";

function getKeyMaterial(secret) {
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value) {
  if (!value) return null;
  if (!appEnv.integrationsTokenKey) {
    throw new Error("INTEGRATIONS_TOKEN_KEY or NEXTAUTH_SECRET is required for token encryption.");
  }

  const iv = crypto.randomBytes(12);
  const key = getKeyMaterial(appEnv.integrationsTokenKey);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(value) {
  if (!value) return null;
  if (!appEnv.integrationsTokenKey) {
    throw new Error("INTEGRATIONS_TOKEN_KEY or NEXTAUTH_SECRET is required for token encryption.");
  }

  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) return null;

  const key = getKeyMaterial(appEnv.integrationsTokenKey);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivValue, "base64"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
