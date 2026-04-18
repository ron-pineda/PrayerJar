import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Hoisted mock state ────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const insertValues = vi.fn().mockResolvedValue([]);

  // handleWebhook and connect are set per-test via mockImplementation
  const handleWebhookFn = vi.fn();
  const connectFn = vi.fn().mockResolvedValue(undefined);

  const adapterFactory = vi.fn().mockResolvedValue({
    connect: connectFn,
    handleWebhook: handleWebhookFn,
  });

  const captureException = vi.fn();

  return { insertValues, handleWebhookFn, connectFn, adapterFactory, captureException };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            id: 'church-uuid-1',
            chmsProvider: 'planning-center',
            chmsConfig: '__ENCRYPTED__',
          },
        ]),
      }),
    }),
    insert: vi.fn().mockReturnValue({ values: mocks.insertValues }),
  },
}));

vi.mock('@/db/schema', () => ({
  churches: {},
  chmsSyncJobs: {},
}));

vi.mock('@/lib/encrypt', () => ({
  decrypt: vi.fn().mockReturnValue(
    JSON.stringify({ pcoOrgId: 'org_789', webhookSecret: 'test-secret' })
  ),
}));

vi.mock('@/lib/chms/providers', () => ({
  CHMS_ADAPTERS: {
    'planning-center': mocks.adapterFactory,
  },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: mocks.captureException,
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { POST } from './route';
import { db } from '@/db';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePcoPayload(overrides: Record<string, unknown> = {}) {
  return {
    data: [
      {
        type: 'EventDelivery',
        id: 'evt_123',
        attributes: {
          created_at: new Date().toISOString(), // within replay window
          name: 'person.updated',
          payload: {
            data: {
              type: 'Person',
              id: 'p_456',
              attributes: {
                first_name: 'Jane',
                last_name: 'Doe',
                status: 'active',
              },
            },
          },
        },
      },
    ],
    meta: { parent: { id: 'org_789', type: 'Organization' } },
    ...overrides,
  };
}

function makeRequest(body: string, extraHeaders: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/webhooks/chms/planning-center', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-pco-webhooks-authenticity': 'valid-sig',
      ...extraHeaders,
    },
    body,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/chms/[provider]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-attach hoisted mocks after clearAllMocks
    mocks.connectFn.mockResolvedValue(undefined);
    mocks.adapterFactory.mockResolvedValue({
      connect: mocks.connectFn,
      handleWebhook: mocks.handleWebhookFn,
    });

    // Default: valid upsert result
    mocks.handleWebhookFn.mockResolvedValue({
      event: 'person.updated',
      externalId: 'p_456',
      action: 'upsert',
      member: {
        externalId: 'p_456',
        firstName: 'Jane',
        lastName: 'Doe',
        email: null,
        phone: null,
        status: 'active',
        raw: {},
      },
    });

    mocks.insertValues.mockResolvedValue([]);
    vi.mocked(db.insert).mockReturnValue({ values: mocks.insertValues } as unknown as ReturnType<typeof db.insert>);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            id: 'church-uuid-1',
            chmsProvider: 'planning-center',
            chmsConfig: '__ENCRYPTED__',
          },
        ]),
      }),
    } as unknown as ReturnType<typeof db.select>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Valid signature → 202 + job inserted
  it('returns 202 and inserts a sync job for a valid webhook', async () => {
    const body = JSON.stringify(makePcoPayload());
    const req = makeRequest(body);

    const res = await POST(req, { params: Promise.resolve({ provider: 'planning-center' }) });

    expect(res.status).toBe(202);
    expect(db.insert).toHaveBeenCalled();
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        churchId: 'church-uuid-1',
        provider: 'planning-center',
        jobType: 'delta_sync',
        status: 'pending',
      })
    );
  });

  // 2. Invalid signature (handleWebhook returns null) → 401 + Sentry called
  it('returns 401 and calls Sentry when signature verification fails', async () => {
    mocks.handleWebhookFn.mockResolvedValue(null);

    const body = JSON.stringify(makePcoPayload());
    const req = makeRequest(body);

    const res = await POST(req, { params: Promise.resolve({ provider: 'planning-center' }) });

    expect(res.status).toBe(401);
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ extra: expect.objectContaining({ provider: 'planning-center' }) })
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  // 3. Unknown provider slug → 404
  it('returns 404 for an unknown provider slug', async () => {
    const body = JSON.stringify(makePcoPayload());
    const req = new NextRequest('http://localhost/api/webhooks/chms/breeze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });

    const res = await POST(req, { params: Promise.resolve({ provider: 'breeze' }) });

    expect(res.status).toBe(404);
    expect(db.insert).not.toHaveBeenCalled();
  });

  // 4. Missing meta.parent.id → 401
  it('returns 401 when payload is missing meta.parent.id', async () => {
    const body = JSON.stringify({ data: [], meta: {} });
    const req = makeRequest(body);

    const res = await POST(req, { params: Promise.resolve({ provider: 'planning-center' }) });

    expect(res.status).toBe(401);
    expect(db.insert).not.toHaveBeenCalled();
  });

  // 5. action === 'ignore' → 200 + { ignored: true }
  it('returns 200 with { ignored: true } when action is ignore', async () => {
    mocks.handleWebhookFn.mockResolvedValue({
      event: 'person.updated',
      externalId: 'p_456',
      action: 'ignore',
    });

    const body = JSON.stringify(makePcoPayload());
    const req = makeRequest(body);

    const res = await POST(req, { params: Promise.resolve({ provider: 'planning-center' }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ignored: true });
    expect(db.insert).not.toHaveBeenCalled();
  });

  // 6. Church not found for pcoOrgId → 401
  it('returns 401 when no church matches the pcoOrgId', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]), // no churches found
      }),
    } as unknown as ReturnType<typeof db.select>);

    const body = JSON.stringify(makePcoPayload());
    const req = makeRequest(body);

    const res = await POST(req, { params: Promise.resolve({ provider: 'planning-center' }) });

    expect(res.status).toBe(401);
    // Sentry should NOT be called for church-not-found (no info leak)
    expect(mocks.captureException).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
