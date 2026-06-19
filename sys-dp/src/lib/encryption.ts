import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export interface EncryptedCert {
  iv: string;
  encrypted: string;
  tag: string;
  validade?: string | null;
  titular?: string | null;
}

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY ausente ou inválida (deve ser 64 hex chars = 32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

export function encryptCert(
  pfxBase64: string,
  senha: string,
  meta?: { validade?: string | null; titular?: string | null },
): EncryptedCert {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const payload = JSON.stringify({ pfxBase64, senha });
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    encrypted: encrypted.toString("base64"),
    tag: tag.toString("base64"),
    validade: meta?.validade ?? null,
    titular: meta?.titular ?? null,
  };
}

export function decryptCert(data: EncryptedCert): { pfxBase64: string; senha: string } {
  const key = getKey();
  const iv = Buffer.from(data.iv, "base64");
  const encryptedBuf = Buffer.from(data.encrypted, "base64");
  const tag = Buffer.from(data.tag, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

export function isEncryptedCert(cert: unknown): cert is EncryptedCert {
  if (!cert || typeof cert !== "object") return false;
  const c = cert as Record<string, unknown>;
  return typeof c.iv === "string" && typeof c.encrypted === "string" && typeof c.tag === "string";
}
