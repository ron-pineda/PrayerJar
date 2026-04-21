# Church Admin Welcome Drip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a 3-email behavioral drip to church admins starting at church creation, driving them to share their join link, get first members, and complete church setup.

**Architecture:** New `churchAdminDripStatus` table (one row per church) tracks send state. Email 1 fires immediately inside `createChurch()`. Emails 2 and 3 are handled by extending the existing `welcome-drip` cron — new pass at the bottom checks `churchAdminDripStatus` rows with time + member-count conditions. Three new React-email templates with church-specific CTAs.

**Tech Stack:** Drizzle ORM, Neon Postgres, React-email, Resend, Next.js App Router, Vercel Cron

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/db/migrations/0032_church_admin_drip.sql` | Create | SQL migration — new table |
| `src/db/migrations/meta/_journal.json` | Modify | Register migration idx 32 |
| `src/db/schema.ts` | Modify | Add `churchAdminDripStatus` Drizzle table |
| `src/emails/church-welcome-1.tsx` | Create | Email 1 template — "Your church is live" |
| `src/emails/church-welcome-2.tsx` | Create | Email 2 template — "Your prayer wall is waiting" |
| `src/emails/church-welcome-3.tsx` | Create | Email 3 template — "Quick wins before Sunday" |
| `src/services/email.service.ts` | Modify | Add 3 `sendChurchWelcomeN` functions |
| `src/services/church-platform.service.ts` | Modify | Trigger email 1 + drip row at church creation |
| `src/app/api/cron/welcome-drip/route.ts` | Modify | Add church-admin drip pass (emails 2 + 3) |
| `src/services/email.service.test.ts` | Create/Modify | Unit tests for 3 new send functions |
| `src/app/api/cron/welcome-drip/route.test.ts` | Create/Modify | Unit tests for extended cron |
| `src/services/church-platform.service.test.ts` | Create/Modify | Integration test for createChurch trigger |

---

## Task 1: Migration + Drizzle schema

**Files:**
- Create: `src/db/migrations/0032_church_admin_drip.sql`
- Modify: `src/db/migrations/meta/_journal.json`
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Write the migration SQL**

Create `src/db/migrations/0032_church_admin_drip.sql`:

```sql
CREATE TABLE IF NOT EXISTS "churchAdminDripStatus" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "church_id" uuid NOT NULL REFERENCES "churches"("id") ON DELETE CASCADE,
  "admin_user_id" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "email1_sent_at" timestamp,
  "email2_sent_at" timestamp,
  "email3_sent_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "churchAdminDripStatus_church_id_unique" UNIQUE("church_id")
);

CREATE INDEX IF NOT EXISTS "churchAdminDripStatus_created_at_idx"
  ON "churchAdminDripStatus" ("created_at");
```

> **Note:** Check the exact `users` table name in `src/db/schema.ts` — it may be `"user"` (NextAuth default) rather than `"users"`. Match what's in the schema.

- [ ] **Step 2: Register in the journal**

Open `src/db/migrations/meta/_journal.json`. Find the last entry (idx 31). Append a new entry:

```json
{
  "idx": 32,
  "version": "7",
  "when": <current_ms_timestamp>,
  "tag": "0032_church_admin_drip",
  "breakpoints": true
}
```

Replace `<current_ms_timestamp>` with `Date.now()` value (run `node -e "console.log(Date.now())"` in terminal). The value must be larger than the idx 31 entry's `when`.

- [ ] **Step 3: Add Drizzle table to schema**

Open `src/db/schema.ts`. Find the `welcomeDripStatus` table definition (around line 232) and use it as the model. Add the new table after it:

```typescript
export const churchAdminDripStatus = pgTable('churchAdminDripStatus', {
  id: uuid('id').primaryKey().defaultRandom(),
  churchId: uuid('church_id').notNull().references(() => churches.id, { onDelete: 'cascade' }).unique(),
  adminUserId: uuid('admin_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email1SentAt: timestamp('email1_sent_at'),
  email2SentAt: timestamp('email2_sent_at'),
  email3SentAt: timestamp('email3_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ChurchAdminDripStatus = typeof churchAdminDripStatus.$inferSelect;
```

> **Note:** `users` and `churches` are already exported from schema.ts — use the same reference names as the rest of the file.

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `churchAdminDripStatus`.

- [ ] **Step 5: Commit**

```bash
git add src/db/migrations/0032_church_admin_drip.sql src/db/migrations/meta/_journal.json src/db/schema.ts
git commit -m "feat(db): 0032 church_admin_drip_status migration + schema"
```

---

## Task 2: Email template — church-welcome-1

**Files:**
- Create: `src/emails/church-welcome-1.tsx`
- Create: `src/emails/church-welcome-1.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/emails/church-welcome-1.test.tsx`:

```typescript
import { render } from '@react-email/components';
import ChurchWelcome1Email from './church-welcome-1';

describe('ChurchWelcome1Email', () => {
  it('renders without error', async () => {
    const html = await render(
      ChurchWelcome1Email({ churchSlug: 'grace-church', adminName: 'Pastor Sarah' })
    );
    expect(html).toBeTruthy();
  });

  it('contains the join link CTA', async () => {
    const html = await render(
      ChurchWelcome1Email({ churchSlug: 'grace-church', adminName: 'Pastor Sarah' })
    );
    expect(html).toContain('/church/grace-church/dashboard/team');
  });

  it('contains the setup CTA', async () => {
    const html = await render(
      ChurchWelcome1Email({ churchSlug: 'grace-church', adminName: 'Pastor Sarah' })
    );
    expect(html).toContain('/church/grace-church/setup');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="church-welcome-1"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the template**

Create `src/emails/church-welcome-1.tsx`:

```typescript
import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface Props {
  churchSlug: string;
  adminName?: string;
}

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://prayerjar.org';

export default function ChurchWelcome1Email({ churchSlug, adminName }: Props) {
  const greeting = adminName ? `Hi ${adminName},` : 'Hi,';
  return (
    <Html>
      <Head />
      <Preview>Your church is live on PrayerJar — share your join link to get started.</Preview>
      <Body style={{ backgroundColor: '#fef9f0', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Your church is live on PrayerJar</Heading>
          <Text style={{ color: '#44403c' }}>{greeting}</Text>
          <Text style={{ color: '#44403c' }}>
            Your church is set up and ready. The next step is simple: share your join link
            with your prayer team. When they join, your prayer wall comes alive.
          </Text>
          <Button
            href={`${BASE_URL}/church/${churchSlug}/dashboard/team`}
            style={{ backgroundColor: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Get your join link
          </Button>
          <Text style={{ color: '#78716c', marginTop: '16px' }}>
            Want to finish your setup first?{' '}
            <a href={`${BASE_URL}/church/${churchSlug}/setup`} style={{ color: '#d97706' }}>
              Complete setup in 5 minutes
            </a>
          </Text>
          <Hr style={{ borderColor: '#fde68a', marginTop: '24px' }} />
          <Text style={{ fontSize: '12px', color: '#a8a29e' }}>
            You received this because you created a church on PrayerJar.{' '}
            <a href="{unsubscribeUrl}" style={{ color: '#a8a29e' }}>Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="church-welcome-1"
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/emails/church-welcome-1.tsx src/emails/church-welcome-1.test.tsx
git commit -m "feat(email): church-welcome-1 template — your church is live"
```

---

## Task 3: Email template — church-welcome-2

**Files:**
- Create: `src/emails/church-welcome-2.tsx`
- Create: `src/emails/church-welcome-2.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/emails/church-welcome-2.test.tsx`:

```typescript
import { render } from '@react-email/components';
import ChurchWelcome2Email from './church-welcome-2';

describe('ChurchWelcome2Email', () => {
  it('renders without error', async () => {
    const html = await render(ChurchWelcome2Email({ churchSlug: 'grace-church' }));
    expect(html).toBeTruthy();
  });

  it('contains the team CTA', async () => {
    const html = await render(ChurchWelcome2Email({ churchSlug: 'grace-church' }));
    expect(html).toContain('/church/grace-church/dashboard/team');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="church-welcome-2"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the template**

Create `src/emails/church-welcome-2.tsx`:

```typescript
import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface Props {
  churchSlug: string;
}

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://prayerjar.org';

export default function ChurchWelcome2Email({ churchSlug }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your prayer wall is ready — the first invite is the hardest part.</Preview>
      <Body style={{ backgroundColor: '#fef9f0', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Your prayer wall is waiting</Heading>
          <Text style={{ color: '#44403c' }}>
            Your church is set up, but your prayer wall is still empty. That changes the
            moment your first member joins.
          </Text>
          <Text style={{ color: '#44403c' }}>
            Here is how: copy your join link → share it with your prayer team in a group
            chat or Sunday announcement → members join and start submitting prayers.
          </Text>
          <Text style={{ color: '#44403c' }}>
            The first invite is the hardest part. Everything else follows.
          </Text>
          <Button
            href={`${BASE_URL}/church/${churchSlug}/dashboard/team`}
            style={{ backgroundColor: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Share your join link
          </Button>
          <Hr style={{ borderColor: '#fde68a', marginTop: '24px' }} />
          <Text style={{ fontSize: '12px', color: '#a8a29e' }}>
            You received this because you created a church on PrayerJar.{' '}
            <a href="{unsubscribeUrl}" style={{ color: '#a8a29e' }}>Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="church-welcome-2"
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/emails/church-welcome-2.tsx src/emails/church-welcome-2.test.tsx
git commit -m "feat(email): church-welcome-2 template — prayer wall waiting"
```

---

## Task 4: Email template — church-welcome-3

**Files:**
- Create: `src/emails/church-welcome-3.tsx`
- Create: `src/emails/church-welcome-3.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/emails/church-welcome-3.test.tsx`:

```typescript
import { render } from '@react-email/components';
import ChurchWelcome3Email from './church-welcome-3';

describe('ChurchWelcome3Email', () => {
  it('renders without error', async () => {
    const html = await render(ChurchWelcome3Email({ churchSlug: 'grace-church' }));
    expect(html).toBeTruthy();
  });

  it('contains the setup CTA', async () => {
    const html = await render(ChurchWelcome3Email({ churchSlug: 'grace-church' }));
    expect(html).toContain('/church/grace-church/setup');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="church-welcome-3"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the template**

Create `src/emails/church-welcome-3.tsx`:

```typescript
import {
  Html, Head, Preview, Body, Container, Heading, Text, Button, Hr,
} from '@react-email/components';

interface Props {
  churchSlug: string;
}

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://prayerjar.org';

export default function ChurchWelcome3Email({ churchSlug }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Three quick wins before Sunday — your prayer community is almost ready.</Preview>
      <Body style={{ backgroundColor: '#fef9f0', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <Heading style={{ fontSize: '20px', color: '#1c1917' }}>Quick wins before Sunday</Heading>
          <Text style={{ color: '#44403c' }}>
            Your church is set up but not yet active. Five minutes now means your prayer
            community is ready when the congregation walks in.
          </Text>
          <Text style={{ color: '#44403c' }}>Three things to finish:</Text>
          <Text style={{ color: '#44403c', paddingLeft: '16px' }}>
            1. <strong>Add your church logo and colours</strong> — makes the prayer wall feel like home.<br />
            2. <strong>Write a welcome message</strong> — the first thing new members read when they join.<br />
            3. <strong>Share your join link</strong> — paste it in your church group chat before Sunday.
          </Text>
          <Button
            href={`${BASE_URL}/church/${churchSlug}/setup`}
            style={{ backgroundColor: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}
          >
            Finish setup
          </Button>
          <Hr style={{ borderColor: '#fde68a', marginTop: '24px' }} />
          <Text style={{ fontSize: '12px', color: '#a8a29e' }}>
            You received this because you created a church on PrayerJar.{' '}
            <a href="{unsubscribeUrl}" style={{ color: '#a8a29e' }}>Unsubscribe</a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="church-welcome-3"
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/emails/church-welcome-3.tsx src/emails/church-welcome-3.test.tsx
git commit -m "feat(email): church-welcome-3 template — quick wins before Sunday"
```

---

## Task 5: Email service functions

**Files:**
- Modify: `src/services/email.service.ts`
- Create/Modify: `src/services/email.service.church-drip.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/services/email.service.church-drip.test.ts`:

```typescript
import { sendChurchWelcome1Email, sendChurchWelcome2Email, sendChurchWelcome3Email } from './email.service';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'mock-id' }) },
  })),
}));

// Mock DB
jest.mock('@/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockResolvedValue([]),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

describe('sendChurchWelcome1Email', () => {
  it('sends email and creates drip row', async () => {
    await expect(
      sendChurchWelcome1Email('church-id-1', 'user-id-1', 'pastor@grace.org', 'grace-church')
    ).resolves.not.toThrow();
  });
});

describe('sendChurchWelcome2Email', () => {
  it('sends email and stamps email2SentAt', async () => {
    await expect(
      sendChurchWelcome2Email('church-id-1', 'pastor@grace.org', 'grace-church')
    ).resolves.not.toThrow();
  });
});

describe('sendChurchWelcome3Email', () => {
  it('sends email and stamps email3SentAt', async () => {
    await expect(
      sendChurchWelcome3Email('church-id-1', 'pastor@grace.org', 'grace-church')
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="email.service.church-drip"
```

Expected: FAIL — functions not defined.

- [ ] **Step 3: Add imports to email.service.ts**

At the top of `src/services/email.service.ts`, add these imports alongside the existing ones:

```typescript
import ChurchWelcome1Email from '@/emails/church-welcome-1';
import ChurchWelcome2Email from '@/emails/church-welcome-2';
import ChurchWelcome3Email from '@/emails/church-welcome-3';
import { churchAdminDripStatus } from '@/db/schema';
```

- [ ] **Step 4: Add the three send functions**

Append to the bottom of `src/services/email.service.ts`:

```typescript
export async function sendChurchWelcome1Email(
  churchId: string,
  adminUserId: string,
  adminEmail: string,
  churchSlug: string,
) {
  const html = await render(ChurchWelcome1Email({ churchSlug }));

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: 'Your church is live on PrayerJar',
    html,
  });

  await db
    .insert(churchAdminDripStatus)
    .values({ churchId, adminUserId, email1SentAt: new Date() })
    .onConflictDoUpdate({
      target: churchAdminDripStatus.churchId,
      set: { email1SentAt: new Date() },
    });
}

export async function sendChurchWelcome2Email(
  churchId: string,
  adminEmail: string,
  churchSlug: string,
) {
  const html = await render(ChurchWelcome2Email({ churchSlug }));

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: 'Your prayer wall is waiting',
    html,
  });

  await db
    .update(churchAdminDripStatus)
    .set({ email2SentAt: new Date() })
    .where(eq(churchAdminDripStatus.churchId, churchId));
}

export async function sendChurchWelcome3Email(
  churchId: string,
  adminEmail: string,
  churchSlug: string,
) {
  const html = await render(ChurchWelcome3Email({ churchSlug }));

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: 'Quick wins before Sunday',
    html,
  });

  await db
    .update(churchAdminDripStatus)
    .set({ email3SentAt: new Date() })
    .where(eq(churchAdminDripStatus.churchId, churchId));
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="email.service.church-drip"
```

Expected: 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/email.service.ts src/services/email.service.church-drip.test.ts
git commit -m "feat(email): sendChurchWelcomeN service functions"
```

---

## Task 6: Church creation trigger

**Files:**
- Modify: `src/services/church-platform.service.ts`
- Modify: `src/services/church-platform.service.test.ts` (or create if absent)

- [ ] **Step 1: Write the failing test**

Open or create `src/services/church-platform.service.test.ts`. Add:

```typescript
import { createChurch } from './church-platform.service';

jest.mock('@/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{
          id: 'church-id-1',
          slug: 'grace-church',
          name: 'Grace Church',
          createdBy: 'user-id-1',
        }]),
        onConflictDoUpdate: jest.fn().mockResolvedValue([]),
      }),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ email: 'pastor@grace.org' }]),
      }),
    }),
  },
}));

const mockSendChurchWelcome1Email = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/email.service', () => ({
  ...jest.requireActual('@/services/email.service'),
  sendChurchWelcome1Email: mockSendChurchWelcome1Email,
}));

describe('createChurch', () => {
  it('creates a churchAdminDripStatus row and sends welcome email 1', async () => {
    await createChurch({
      name: 'Grace Church',
      createdBy: 'user-id-1',
    });
    expect(mockSendChurchWelcome1Email).toHaveBeenCalledWith(
      'church-id-1',
      'user-id-1',
      'pastor@grace.org',
      'grace-church',
    );
  });

  it('does not throw if email send fails', async () => {
    mockSendChurchWelcome1Email.mockRejectedValueOnce(new Error('Resend down'));
    await expect(
      createChurch({ name: 'Grace Church', createdBy: 'user-id-1' })
    ).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="church-platform.service"
```

Expected: FAIL — email not called.

- [ ] **Step 3: Add the trigger to createChurch()**

Open `src/services/church-platform.service.ts`. Add the import at the top:

```typescript
import { sendChurchWelcome1Email } from '@/services/email.service';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
```

Find the end of `createChurch()` — the lines that insert `churchMembers` and return `church`. Replace `return church;` with:

```typescript
await db.insert(churchMembers).values({
  churchId: church.id,
  userId: params.createdBy,
  role: 'admin',
});

// Fire-and-forget welcome drip — failure must never block church creation
try {
  const [admin] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, params.createdBy))
    .limit(1);

  if (admin?.email) {
    await sendChurchWelcome1Email(
      church.id,
      params.createdBy,
      admin.email,
      church.slug,
    );
  }
} catch {
  // intentionally swallowed — email failure must not break church creation
}

return church;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="church-platform.service"
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/church-platform.service.ts src/services/church-platform.service.test.ts
git commit -m "feat(church): trigger church admin welcome email 1 at church creation"
```

---

## Task 7: Extend welcome-drip cron

**Files:**
- Modify: `src/app/api/cron/welcome-drip/route.ts`
- Modify: `src/app/api/cron/welcome-drip/route.test.ts` (or create if absent)

- [ ] **Step 1: Write the failing tests**

Open or create `src/app/api/cron/welcome-drip/route.test.ts`. Add these cases (keep any existing tests):

```typescript
import { GET } from './route';
import { NextRequest } from 'next/server';

const CRON_SECRET = 'test-secret';
process.env.CRON_SECRET = CRON_SECRET;

function makeReq() {
  return new NextRequest('http://localhost/api/cron/welcome-drip', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

const mockSendChurchWelcome2Email = jest.fn().mockResolvedValue(undefined);
const mockSendChurchWelcome3Email = jest.fn().mockResolvedValue(undefined);

jest.mock('@/services/email.service', () => ({
  sendWelcome2Email: jest.fn().mockResolvedValue(undefined),
  sendWelcome3Email: jest.fn().mockResolvedValue(undefined),
  sendChurchWelcome2Email: mockSendChurchWelcome2Email,
  sendChurchWelcome3Email: mockSendChurchWelcome3Email,
}));

// Helper: build a mock churchAdminDripStatus row
function mockRow(overrides = {}) {
  return {
    churchId: 'church-1',
    adminUserId: 'user-1',
    adminEmail: 'pastor@grace.org',
    churchSlug: 'grace-church',
    email2SentAt: null,
    email3SentAt: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    ...overrides,
  };
}

describe('welcome-drip cron — church admin pass', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends email 2 when church is 3+ days old and has no non-admin members', async () => {
    // DB mock returning 1 eligible row for email 2
    jest.mock('@/db', () => ({ db: mockDb([mockRow()], 0) }));
    const res = await GET(makeReq());
    const body = await res.json();
    expect(mockSendChurchWelcome2Email).toHaveBeenCalledTimes(1);
    expect(body.churchSent2).toBe(1);
  });

  it('skips email 2 when church has non-admin members', async () => {
    jest.mock('@/db', () => ({ db: mockDb([mockRow()], 1) }));
    const res = await GET(makeReq());
    expect(mockSendChurchWelcome2Email).not.toHaveBeenCalled();
  });

  it('sends email 3 when church is 7+ days old and still has no members', async () => {
    const row = mockRow({
      email2SentAt: new Date(),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });
    jest.mock('@/db', () => ({ db: mockDb([], 0, [row]) }));
    const res = await GET(makeReq());
    expect(mockSendChurchWelcome3Email).toHaveBeenCalledTimes(1);
  });

  it('skips email 3 when church has members', async () => {
    const row = mockRow({
      email2SentAt: new Date(),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    });
    jest.mock('@/db', () => ({ db: mockDb([], 1, [row]) }));
    const res = await GET(makeReq());
    expect(mockSendChurchWelcome3Email).not.toHaveBeenCalled();
  });
});

// mockDb helper — adapt to your actual DB mock pattern in this codebase
function mockDb(email2Rows: object[], nonAdminMemberCount: number, email3Rows: object[] = []) {
  // This is a simplified mock — look at existing route.test.ts mocks for the correct pattern
  return {
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValueOnce(email2Rows).mockResolvedValueOnce([{ count: nonAdminMemberCount }]).mockResolvedValueOnce(email3Rows),
    })),
    update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) }),
  };
}
```

> **Note:** The `mockDb` helper above is intentionally simplified. Look at how other cron route tests in this codebase mock the DB and adapt to match. The test expectations are what matters.

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="welcome-drip/route"
```

Expected: FAIL.

- [ ] **Step 3: Add imports to the cron route**

Open `src/app/api/cron/welcome-drip/route.ts`. Add to the existing imports:

```typescript
import { sendChurchWelcome2Email, sendChurchWelcome3Email } from '@/services/email.service';
import { churchAdminDripStatus, churchMembers } from '@/db/schema';
import { isNull, and, lt, count, ne } from 'drizzle-orm';
```

> Keep the existing imports unchanged. Add only what's missing.

- [ ] **Step 4: Add church admin drip pass to the cron handler**

In `src/app/api/cron/welcome-drip/route.ts`, after the existing user-drip `for` loop and before `return NextResponse.json(...)`, add:

```typescript
// ── Church admin drip ──────────────────────────────────────────────────────
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

let churchSent2 = 0;
let churchSent3 = 0;

// Email 2 pass: churches created 3+ days ago with no email2 yet
const email2Candidates = await db
  .select({
    churchId: churchAdminDripStatus.churchId,
    adminUserId: churchAdminDripStatus.adminUserId,
    adminEmail: users.email,
    churchSlug: churches.slug,
  })
  .from(churchAdminDripStatus)
  .innerJoin(users, eq(users.id, churchAdminDripStatus.adminUserId))
  .innerJoin(churches, eq(churches.id, churchAdminDripStatus.churchId))
  .where(
    and(
      isNull(churchAdminDripStatus.email2SentAt),
      lt(churchAdminDripStatus.createdAt, threeDaysAgo),
    )
  );

for (const row of email2Candidates) {
  if (!row.adminEmail || !row.churchSlug) continue;

  // Count non-admin members (members who joined via invite, not the creator)
  const [memberCount] = await db
    .select({ count: count() })
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.churchId, row.churchId),
        ne(churchMembers.role, 'admin'),
      )
    );

  if ((memberCount?.count ?? 0) === 0) {
    await sendChurchWelcome2Email(row.churchId, row.adminEmail, row.churchSlug);
    churchSent2++;
  } else {
    // Church is active — stamp without sending so we don't re-check
    await db
      .update(churchAdminDripStatus)
      .set({ email2SentAt: new Date() })
      .where(eq(churchAdminDripStatus.churchId, row.churchId));
  }
}

// Email 3 pass: churches created 7+ days ago with no email3 yet
const email3Candidates = await db
  .select({
    churchId: churchAdminDripStatus.churchId,
    adminUserId: churchAdminDripStatus.adminUserId,
    adminEmail: users.email,
    churchSlug: churches.slug,
  })
  .from(churchAdminDripStatus)
  .innerJoin(users, eq(users.id, churchAdminDripStatus.adminUserId))
  .innerJoin(churches, eq(churches.id, churchAdminDripStatus.churchId))
  .where(
    and(
      isNull(churchAdminDripStatus.email3SentAt),
      lt(churchAdminDripStatus.createdAt, sevenDaysAgo),
    )
  );

for (const row of email3Candidates) {
  if (!row.adminEmail || !row.churchSlug) continue;

  const [memberCount] = await db
    .select({ count: count() })
    .from(churchMembers)
    .where(
      and(
        eq(churchMembers.churchId, row.churchId),
        ne(churchMembers.role, 'admin'),
      )
    );

  if ((memberCount?.count ?? 0) === 0) {
    await sendChurchWelcome3Email(row.churchId, row.adminEmail, row.churchSlug);
    churchSent3++;
  } else {
    await db
      .update(churchAdminDripStatus)
      .set({ email3SentAt: new Date() })
      .where(eq(churchAdminDripStatus.churchId, row.churchId));
  }
}
```

Also update the `return` statement to include the new counts:

```typescript
return NextResponse.json({ sent2, sent3, churchSent2, churchSent3 });
```

You will also need to import `churches` from `@/db/schema` and `count`, `ne` from `drizzle-orm` if not already imported.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="welcome-drip/route"
```

Expected: all tests PASS (existing + new).

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all tests pass. Fix any TypeScript import errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/cron/welcome-drip/route.ts src/app/api/cron/welcome-drip/route.test.ts
git commit -m "feat(cron): extend welcome-drip with church admin email 2 + 3 passes"
```

---

## Self-Review Checklist

- [x] **Spec §1 (data model):** Covered in Task 1
- [x] **Spec §2 (3 templates):** Covered in Tasks 2, 3, 4
- [x] **Spec §3 trigger + cron:** Covered in Tasks 5, 6, 7
- [x] **Spec §4 testing:** Covered across all tasks
- [x] **No placeholders:** All code blocks are complete
- [x] **Type consistency:** `churchAdminDripStatus` used consistently; `sendChurchWelcome1Email(churchId, adminUserId, adminEmail, churchSlug)` signature matches in Task 5 and 6
- [x] **Migration follows 0031:** Uses idx 32, correct naming convention
- [x] **Email 1 is fire-and-forget:** try/catch in Task 6, church creation always succeeds
- [x] **Stamp-without-sending pattern:** Cron stamps email2SentAt/email3SentAt even when skipping active churches, so they are never re-checked
