# Security Review: encrypt.ts — Sprint 18 ChMS Integration

**Reviewed by:** Security (agent)
**Date:** 2026-04-18
**Decision:** PASS

---

## Crypto correctness checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | GCM mode with 12-byte IV | PASS | `randomBytes(12)` used at encrypt.ts:26. NIST SP 800-38D recommends 96-bit (12-byte) IV for GCM — correct. |
| 2 | authTag verified on decrypt | PASS | `decipher.setAuthTag(authTag)` at encrypt.ts:57; `decipher.final()` at encrypt.ts:61 performs the GCM tag verification and throws on mismatch. Node.js crypto enforces this — tampered authTag test confirms it. |
| 3 | IV never reused for the same key | PASS | `randomBytes(12)` is called inside `encrypt()` on every invocation (encrypt.ts:26), generating a cryptographically random IV per call. No IV caching or counter-based IV derivation. |
| 4 | Key length validated (32 bytes) | PASS | Two-layer validation at module load: (a) string length check `key.length !== 64` (64 hex chars = 32 bytes) at encrypt.ts:6; (b) decoded buffer length check `keyBuf.length !== 32` at encrypt.ts:13. Both throw before any function is exported. |
| 5 | Constant-time authTag comparison | PASS | No custom authTag comparison implemented. Node.js `decipher.final()` invokes OpenSSL's `EVP_AEAD_CTX_finish` which performs constant-time comparison internally. No user-space byte-by-byte loop present. |
| 6 | No silent error paths | PASS | `decrypt()` throws `Error('Decryption failed: ciphertext is too short')` for undersized blobs (encrypt.ts:49) and propagates the Node.js crypto throw on authTag failure (encrypt.ts:61). Return type is `string` — no `null`/`undefined`/`false` return path exists. |
| 7 | No key material in error messages or logs | PASS | The two thrown errors at encrypt.ts:7 and encrypt.ts:14 contain only the constraint description. No key bytes, no `key` variable, no hex output included in any error message in the file. |
| 8 | Algorithm string hardcoded | PASS | `'aes-256-gcm'` is a string literal at encrypt.ts:27 and encrypt.ts:56, not a variable. No algorithm indirection possible. |

---

## Issues found

None. All 8 checklist items pass.

---

## Test coverage assessment

`encrypt.test.ts` covers:

- Round-trip: normal string (test 1)
- Round-trip: empty string (test 2 — important edge case; GCM on zero bytes is valid and tested)
- Round-trip: long string >1000 chars (test 3)
- Wrong key throws (test 4 — exercises Node.js GCM authTag rejection)
- Tampered ciphertext body throws (test 5 — flips ciphertext byte, verifies authTag catches it)
- Tampered authTag throws (test 6 — flips authTag byte directly)
- Missing env var throws at module load (test 7)
- Wrong-length env var throws at module load (test 8)

Coverage is complete for the stated acceptance criteria. One observation (non-blocking): test 4 ("wrong key") drives the decryption manually via raw `createDecipheriv` rather than calling `decrypt()` with a different key. This still validates the cryptographic property but does not test the `decrypt()` function's code path with a wrong key. This is acceptable — the authTag-tamper tests (5, 6) exercise the same Node.js throw path that a wrong key would trigger through `decrypt()`.

---

## Key rotation plan

### Chosen approach: Option B — One-time re-encryption migration on deploy

**Rationale:**

**Scale:** At Sprint 18 launch PrayerJar expects fewer than 50 church accounts with ChMS enabled. The re-encryption migration script would touch at most 50 database rows and runs in under a second. The "large migration" concern that makes Option B risky in mature systems does not apply here.

**Threat model:** Two rotation scenarios exist:

1. *Quarterly scheduled rotation* — planned, run during a low-traffic maintenance window. Option B is straightforward: run the script, verify all rows updated, deploy the new key.
2. *Incident response (key compromise)* — urgent. Option B is still correct: the old key is compromised so it must be purged immediately. Option A would require keeping the compromised key active in the environment (even as `_OLD`), which directly contradicts the incident-response goal. Option B eliminates the old key cleanly.

**Option A rejected:** Dual-key decrypt adds complexity to the hot path of every token access. It requires operational discipline to remove `CHMS_CONFIG_ENCRYPTION_KEY_OLD` after rotation completes — a step that is routinely forgotten. Most critically, in the compromise scenario it keeps the compromised key alive in production environment variables during the transition period, which is the exact period when the threat is active.

**Option C rejected:** Severing all existing church ChMS connections and requiring admins to re-authorize OAuth is user-visible disruption. For a product in early growth where church admin trust is being established, forced reconnects on a maintenance event would damage credibility. Option C is the right fallback *if* a migration script fails mid-run and leaves the DB in a partial state, but it should not be the primary plan.

### Implementation sketch

**Pre-rotation checklist:**
1. Generate a new 32-byte key: `openssl rand -hex 32` → copy the 64-char hex string.
2. Set `CHMS_CONFIG_ENCRYPTION_KEY_NEW` in your secrets manager (do not yet change the primary key).

**Migration script** (`scripts/rotate-encrypt-key.ts`):

```typescript
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../src/lib/encrypt'; // uses old key from env

const OLD_KEY = process.env.CHMS_CONFIG_ENCRYPTION_KEY!;       // old key
const NEW_KEY = process.env.CHMS_CONFIG_ENCRYPTION_KEY_NEW!;   // new key

// Minimal inline encrypt with new key — avoids importing module-singleton
import { createCipheriv, randomBytes } from 'node:crypto';
function encryptWithKey(plaintext: string, keyBuf: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBuf, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString('base64');
}

const prisma = new PrismaClient();
const newKeyBuf = Buffer.from(NEW_KEY, 'hex');

const churches = await prisma.church.findMany({
  where: { chmsConfig: { not: null } },
  select: { id: true, chmsConfig: true },
});

let rotated = 0;
for (const church of churches) {
  const plaintext = decrypt(church.chmsConfig!);           // decrypts with OLD_KEY via env
  const reencrypted = encryptWithKey(plaintext, newKeyBuf);
  await prisma.church.update({
    where: { id: church.id },
    data: { chmsConfig: reencrypted },
  });
  rotated++;
}
console.log(`Rotated ${rotated} of ${churches.length} churches.`);
await prisma.$disconnect();
```

**Deployment sequence:**
1. Run the migration script with both `CHMS_CONFIG_ENCRYPTION_KEY` (old) and `CHMS_CONFIG_ENCRYPTION_KEY_NEW` (new) set.
2. Verify `rotated === churches.length` with no errors.
3. Swap the primary env var: set `CHMS_CONFIG_ENCRYPTION_KEY` = new value. Remove `CHMS_CONFIG_ENCRYPTION_KEY_NEW`.
4. Deploy the application. No code changes required — the module loads the new key at startup.
5. Remove the old key from secrets manager.

**Partial-failure recovery:** If the script fails mid-run, rows are in a mixed state (some old key, some new key). Recovery: re-run with the old key still set in env. Rows already re-encrypted with the new key will fail to `decrypt()` — catch those errors individually, log the church ID, and skip (they're already done). Re-run until all rows succeed.

**Rotation cadence recommendation:** Quarterly rotation via the above script. For a key compromise, treat it as a P0 incident: run the migration script immediately, force-rotate the env var, redeploy within the incident window. No application code changes needed for either scenario.

---

## Sign-off

**PASS — Integrations agent may proceed.**

`src/lib/encrypt.ts` is cryptographically correct. All 8 checklist items pass. Test coverage is complete. The key rotation plan (Option B, one-time re-encryption migration) is documented with an implementation sketch. No changes to `encrypt.ts` or `encrypt.test.ts` are required before the Integrations agent begins `pj-s18-05` (PCO OAuth adapter).
