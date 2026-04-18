import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const key = process.env.CHMS_CONFIG_ENCRYPTION_KEY;

// Fail-fast at module load — not on first call
if (!key || key.length !== 64) {
  throw new Error('CHMS_CONFIG_ENCRYPTION_KEY must be a 64-character hex string');
}

const keyBuf = Buffer.from(key, 'hex');

// Belt-and-suspenders: ensure the hex decode actually produced 32 bytes
if (keyBuf.length !== 32) {
  throw new Error('CHMS_CONFIG_ENCRYPTION_KEY must be a 64-character hex string');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * Returns a base64-encoded string containing:
 *   iv (12 bytes) || ciphertext (N bytes) || authTag (16 bytes)
 *
 * The output is safe to store in a single text column.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBuf, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag(); // 16 bytes

  return Buffer.concat([iv, encrypted, authTag]).toString('base64');
}

/**
 * Decrypts a base64-encoded AES-256-GCM ciphertext produced by `encrypt`.
 *
 * Throws on tampered ciphertext, tampered authTag, or wrong key.
 * Never returns null silently.
 */
export function decrypt(ciphertext: string): string {
  const blob = Buffer.from(ciphertext, 'base64');

  if (blob.length < 12 + 16) {
    throw new Error('Decryption failed: ciphertext is too short');
  }

  const iv = blob.subarray(0, 12);
  const encrypted = blob.subarray(12, blob.length - 16);
  const authTag = blob.subarray(blob.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', keyBuf, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(), // throws if authTag verification fails
  ]);

  return decrypted.toString('utf8');
}
