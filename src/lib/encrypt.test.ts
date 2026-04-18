import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createDecipheriv } from 'node:crypto';

// A valid 64-hex-char key for all tests except the "wrong key" and "missing env" cases.
const VALID_KEY = 'a'.repeat(64); // 32 bytes of 0xaa

// Set the env var before the module is imported (module load is eager in the test suite).
// vi.stubEnv must be called before the import below.
vi.stubEnv('CHMS_CONFIG_ENCRYPTION_KEY', VALID_KEY);

// Import after stubbing so the module-load key check passes.
const { encrypt, decrypt } = await import('./encrypt');

describe('encrypt / decrypt', () => {
  afterAll(() => {
    vi.unstubAllEnvs();
  });

  // 1. Round-trip: normal string
  it('round-trips a normal string', () => {
    const plaintext = 'Hello, PrayerJar!';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  // 2. Round-trip: empty string
  it('round-trips an empty string', () => {
    expect(decrypt(encrypt(''))).toBe('');
  });

  // 3. Round-trip: long string (>1000 chars)
  it('round-trips a long string (>1000 chars)', () => {
    const long = 'x'.repeat(1500);
    expect(decrypt(encrypt(long))).toBe(long);
  });

  // 4. Wrong key: decrypt with a different key throws
  it('throws when decrypted with the wrong key', () => {
    const plaintext = 'secret prayer';
    const blob = encrypt(plaintext);

    // Decode the blob to extract iv + ciphertext + authTag
    const buf = Buffer.from(blob, 'base64');
    const iv = buf.subarray(0, 12);
    const encrypted = buf.subarray(12, buf.length - 16);
    const authTag = buf.subarray(buf.length - 16);

    // Use a different 32-byte key directly via crypto
    const wrongKey = Buffer.from('b'.repeat(64), 'hex'); // 32 bytes of 0xbb
    const decipher = createDecipheriv('aes-256-gcm', wrongKey, iv);
    decipher.setAuthTag(authTag);

    expect(() => {
      decipher.update(encrypted);
      decipher.final();
    }).toThrow();
  });

  // 5. Tampered ciphertext: flip a byte in the ciphertext portion → throws
  it('throws when the ciphertext body is tampered', () => {
    const plaintext = 'tamper me';
    const blob = encrypt(plaintext);

    const buf = Buffer.from(blob, 'base64');
    // Flip a byte in the ciphertext region (byte 12, first ciphertext byte)
    buf[12] ^= 0xff;

    const tampered = buf.toString('base64');
    expect(() => decrypt(tampered)).toThrow();
  });

  // 6. Tampered authTag: flip a byte in the last 16 bytes → throws
  it('throws when the authTag is tampered', () => {
    const plaintext = 'tamper my tag';
    const blob = encrypt(plaintext);

    const buf = Buffer.from(blob, 'base64');
    // Flip a byte in the last 16 bytes (authTag region)
    buf[buf.length - 1] ^= 0xff;

    const tampered = buf.toString('base64');
    expect(() => decrypt(tampered)).toThrow();
  });
});

// 7. Missing env var: importing with CHMS_CONFIG_ENCRYPTION_KEY unset throws at module load
describe('module load validation', () => {
  it('throws at module load when CHMS_CONFIG_ENCRYPTION_KEY is not set', async () => {
    vi.resetModules();
    // Remove the env var entirely
    delete process.env.CHMS_CONFIG_ENCRYPTION_KEY;
    await expect(import('./encrypt')).rejects.toThrow(
      'CHMS_CONFIG_ENCRYPTION_KEY must be a 64-character hex string'
    );
  });

  it('throws at module load when CHMS_CONFIG_ENCRYPTION_KEY has wrong length', async () => {
    vi.resetModules();
    process.env.CHMS_CONFIG_ENCRYPTION_KEY = 'abc123'; // only 6 chars
    await expect(import('./encrypt')).rejects.toThrow(
      'CHMS_CONFIG_ENCRYPTION_KEY must be a 64-character hex string'
    );
  });
});
