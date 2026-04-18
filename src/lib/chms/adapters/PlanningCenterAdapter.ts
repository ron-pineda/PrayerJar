import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  ChmsAdapter,
  ChmsConfig,
  ChmsMember,
  ChmsGroup,
  ChmsWebhookResult,
} from '../ChmsAdapter';
import { db } from '@/db';
import { churches, churchMembers, users, chmsSyncJobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/encrypt';
import { notifyAdmins } from '@/lib/admin-notify';
import { RateLimiter } from '../rateLimiter';

const PCO_TOKEN_URL = 'https://api.planningcenteronline.com/oauth/token';
const PCO_REVOKE_URL = 'https://api.planningcenteronline.com/oauth/revoke';
const PCO_PEOPLE_URL = 'https://api.planningcenteronline.com/people/v2/people?per_page=100';
const PCO_GROUPS_URL = 'https://api.planningcenteronline.com/groups/v2/groups?per_page=100';

export class PlanningCenterAdapter implements ChmsAdapter {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private config: ChmsConfig | null = null;
  /** Set when connect() is called and stored so private helpers can read it. */
  private churchId: string | null = null;
  /** Per-org token-bucket: 100 requests per 60 seconds. */
  private readonly rateLimiter = new RateLimiter(100, 60_000);

  constructor() {
    const clientId = process.env.CHMS_PLANNING_CENTER_CLIENT_ID;
    const clientSecret = process.env.CHMS_PLANNING_CENTER_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error(
        'Missing required env vars: CHMS_PLANNING_CENTER_CLIENT_ID and CHMS_PLANNING_CENTER_CLIENT_SECRET'
      );
    }
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  // ─────────────────────────────────────────────────────────────
  // Core lifecycle
  // ─────────────────────────────────────────────────────────────

  async connect(config: ChmsConfig): Promise<void> {
    this.config = config;
  }

  async disconnect(churchId: string): Promise<void> {
    if (this.config?.accessToken) {
      try {
        await fetch(PCO_REVOKE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ token: this.config.accessToken }).toString(),
        });
      } catch {
        // Best-effort — continue clearing local state even if revocation fails
      }
    }

    await db
      .update(churches)
      .set({ chmsConfig: null, chmsProvider: null })
      .where(eq(churches.id, churchId));

    this.config = null;
    this.churchId = null;
  }

  // ─────────────────────────────────────────────────────────────
  // OAuth helpers
  // ─────────────────────────────────────────────────────────────

  getAuthorizationUrl(state: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const redirectUri = `${appUrl}/api/auth/chms/callback/planning-center`;
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'people groups',
      state,
    });
    return `https://api.planningcenteronline.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, churchId: string): Promise<ChmsConfig> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const redirectUri = `${appUrl}/api/auth/chms/callback/planning-center`;

    const res = await fetch(PCO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!res.ok) {
      throw new Error(`PCO token exchange failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const tokenExpiresAt = new Date(
      Date.now() + data.expires_in * 1000
    ).toISOString();

    // Fetch the PCO organization ID so webhook events can be matched back to this church.
    // Best-effort: if the sub-request fails, OAuth still succeeds; pcoOrgId stays undefined
    // and webhook lookup for this church will silently fail until they reconnect.
    let pcoOrgId: string | undefined;
    try {
      const meRes = await fetch(
        'https://api.planningcenteronline.com/people/v2/me',
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (meRes.ok) {
        const meData = (await meRes.json()) as {
          data?: { relationships?: { organization?: { data?: { id?: string } } } };
        };
        const orgId = meData?.data?.relationships?.organization?.data?.id;
        if (orgId) pcoOrgId = orgId;
      }
    } catch {
      // Non-fatal — OAuth flow continues without pcoOrgId
    }

    const config: ChmsConfig = {
      provider: 'planning-center',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt,
      connectedAt: new Date().toISOString(),
      groupsAvailable: true,
      ...(pcoOrgId !== undefined ? { pcoOrgId } : {}),
    };

    const encryptedConfig = encrypt(JSON.stringify(config));

    await db
      .update(churches)
      .set({ chmsConfig: encryptedConfig, chmsProvider: 'planning-center' })
      .where(eq(churches.id, churchId));

    await db.insert(chmsSyncJobs).values({
      churchId,
      provider: 'planning-center',
      jobType: 'full_sync',
      status: 'pending',
    });

    this.config = config;
    this.churchId = churchId;

    return config;
  }

  // ─────────────────────────────────────────────────────────────
  // Private API helpers
  // ─────────────────────────────────────────────────────────────

  private async authRequest(method: string, url: string, body?: unknown): Promise<unknown> {
    if (!this.config?.accessToken) {
      throw new Error('PlanningCenterAdapter: not connected (no accessToken)');
    }

    // Throttle before every outbound request (including retries) to stay
    // within Planning Center's 100 req/min limit per organization.
    await this.rateLimiter.throttle();

    const makeRequest = async (token: string) =>
      fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

    let response = await makeRequest(this.config.accessToken);

    if (response.status === 401) {
      // Attempt refresh — consumes another rate-limiter token for the retry
      await this.refreshAccessToken(this.churchId ?? '');
      await this.rateLimiter.throttle();
      response = await makeRequest(this.config!.accessToken!);

      if (response.status === 401) {
        throw new Error('PCO_AUTH_EXPIRED');
      }
    }

    if (response.status === 429) {
      throw new Error('PCO_RATE_LIMITED');
    }

    if (!response.ok) {
      throw new Error(`PCO API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Like authRequest but returns the raw Response so callers can inspect the
   * status code (e.g. 403 for Groups module not licensed) without throwing.
   */
  private async authRequestRaw(method: string, url: string): Promise<Response> {
    if (!this.config?.accessToken) {
      throw new Error('PlanningCenterAdapter: not connected (no accessToken)');
    }

    await this.rateLimiter.throttle();

    const makeRequest = async (token: string) =>
      fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

    let response = await makeRequest(this.config.accessToken);

    if (response.status === 401) {
      await this.refreshAccessToken(this.churchId ?? '');
      await this.rateLimiter.throttle();
      response = await makeRequest(this.config!.accessToken!);

      if (response.status === 401) {
        throw new Error('PCO_AUTH_EXPIRED');
      }
    }

    if (response.status === 429) {
      throw new Error('PCO_RATE_LIMITED');
    }

    return response;
  }

  private async refreshAccessToken(churchId: string): Promise<void> {
    if (!this.config?.refreshToken) {
      throw new Error('PCO_REFRESH_FAILED');
    }

    const res = await fetch(PCO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }).toString(),
    });

    if (!res.ok) {
      throw new Error('PCO_REFRESH_FAILED');
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    this.config.accessToken = data.access_token;
    this.config.refreshToken = data.refresh_token;
    this.config.tokenExpiresAt = new Date(
      Date.now() + data.expires_in * 1000
    ).toISOString();

    if (churchId) {
      const encryptedConfig = encrypt(JSON.stringify(this.config));
      await db
        .update(churches)
        .set({ chmsConfig: encryptedConfig })
        .where(eq(churches.id, churchId));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // listMembers — pj-s18-06
  // ─────────────────────────────────────────────────────────────

  async listMembers(_churchId: string): Promise<ChmsMember[]> {
    const members: ChmsMember[] = [];
    let nextUrl: string | null = PCO_PEOPLE_URL;

    while (nextUrl) {
      const page = (await this.authRequest('GET', nextUrl)) as {
        data: Array<{
          id: string;
          attributes: {
            first_name: string;
            last_name: string;
            status: string;
            primary_email_address?: { address: string } | null;
          };
        }>;
        links?: { next?: string | null };
      };

      for (const person of page.data) {
        members.push({
          externalId: person.id,
          firstName: person.attributes.first_name,
          lastName: person.attributes.last_name,
          // PCO may sideload primary_email_address as a nested attribute
          email: person.attributes.primary_email_address?.address ?? null,
          // Phone not stored in Sprint 18 per spec §5
          phone: null,
          status: person.attributes.status === 'active' ? 'active' : 'inactive',
          raw: person as unknown as Record<string, unknown>,
        });
      }

      nextUrl = page.links?.next ?? null;
    }

    return members;
  }

  // ─────────────────────────────────────────────────────────────
  // listGroups — pj-s18-06
  // ─────────────────────────────────────────────────────────────

  async listGroups(churchId: string): Promise<ChmsGroup[]> {
    // Use raw request so we can inspect the 403 without throwing
    const firstResponse = await this.authRequestRaw('GET', PCO_GROUPS_URL);

    if (firstResponse.status === 403) {
      // Groups module not licensed for this org — mark and persist gracefully
      if (this.config) {
        this.config.groupsAvailable = false;
        const encryptedConfig = encrypt(JSON.stringify(this.config));
        await db
          .update(churches)
          .set({ chmsConfig: encryptedConfig })
          .where(eq(churches.id, churchId));
      }
      return [];
    }

    if (!firstResponse.ok) {
      throw new Error(`PCO API error: ${firstResponse.status}`);
    }

    const groups: ChmsGroup[] = [];

    // Process the first page we already have
    const processPage = async (pageData: {
      data: Array<{
        id: string;
        attributes: { name: string; description?: string | null };
      }>;
      links?: { next?: string | null };
    }): Promise<string | null> => {
      for (const group of pageData.data) {
        const memberExternalIds = await this.fetchGroupMemberIds(group.id);
        groups.push({
          externalId: group.id,
          name: group.attributes.name,
          description: group.attributes.description ?? null,
          memberExternalIds,
          raw: group as unknown as Record<string, unknown>,
        });
      }
      return pageData.links?.next ?? null;
    };

    let firstPage = (await firstResponse.json()) as {
      data: Array<{
        id: string;
        attributes: { name: string; description?: string | null };
      }>;
      links?: { next?: string | null };
    };

    let nextUrl: string | null = await processPage(firstPage);

    // Paginate remaining group pages
    while (nextUrl) {
      const page = (await this.authRequest('GET', nextUrl)) as typeof firstPage;
      nextUrl = await processPage(page);
    }

    return groups;
  }

  /**
   * Fetch all member person IDs for a given PCO group, following pagination.
   */
  private async fetchGroupMemberIds(groupId: string): Promise<string[]> {
    const memberIds: string[] = [];
    let nextUrl: string | null =
      `https://api.planningcenteronline.com/groups/v2/groups/${groupId}/memberships?per_page=100`;

    while (nextUrl) {
      const page = (await this.authRequest('GET', nextUrl)) as {
        data: Array<{
          relationships: { person: { data: { id: string } } };
        }>;
        links?: { next?: string | null };
      };

      for (const membership of page.data) {
        memberIds.push(membership.relationships.person.data.id);
      }

      nextUrl = page.links?.next ?? null;
    }

    return memberIds;
  }

  // ─────────────────────────────────────────────────────────────
  // syncMember — pj-s18-06
  // ─────────────────────────────────────────────────────────────

  async syncMember(churchId: string, member: ChmsMember): Promise<void> {
    // Members without email cannot be linked to a user account (no stub possible)
    if (!member.email) {
      // Cannot create a stub user without an email address — skip the upsert.
      // The churchMembers row requires a non-null userId per schema constraints.
      return;
    }

    // 1. Look up existing user by email
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, member.email));

    let userId: string;

    if (existingUsers.length > 0) {
      // User already exists — link them
      userId = existingUsers[0].id;
    } else {
      // 2. Create stub user and notify admins to send an invite
      const newId = crypto.randomUUID();
      await db.insert(users).values({
        id: newId,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        emailVerified: null,
      });

      userId = newId;

      // Notify admins that a stub user was created and needs an invite sent.
      // (A dedicated user-facing invite email flow is tracked for a future sprint.)
      await notifyAdmins({
        subject: `[PrayerJar] New stub user created via ChMS sync`,
        body: `A stub user was created for ${member.firstName} ${member.lastName} (${member.email}) during a Planning Center sync for church ${churchId}. Please send them an invite to activate their account.`,
      }).catch(() => {
        // Fire-and-forget — never block sync on notification failure
      });
    }

    // 3. Upsert churchMembers row keyed on (churchId, chmsProvider, externalChmsId)
    await db
      .insert(churchMembers)
      .values({
        churchId,
        userId,
        chmsProvider: 'planning-center',
        externalChmsId: member.externalId,
        chmsStatus: member.status,
        chmsSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          churchMembers.churchId,
          churchMembers.chmsProvider,
          churchMembers.externalChmsId,
        ],
        set: {
          userId,
          chmsStatus: member.status,
          chmsSyncedAt: new Date(),
        },
      });
  }

  // ─────────────────────────────────────────────────────────────
  // Unimplemented stubs — future sprints
  // ─────────────────────────────────────────────────────────────

  async pushPrayerSummary(
    _churchId: string,
    _externalMemberId: string,
    _summary: string
  ): Promise<void> {
    throw new Error('pushPrayerSummary not yet implemented — pj-s18-06');
  }

  async handleWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<ChmsWebhookResult | null> {
    // Must have a webhook secret configured to verify the signature
    const secret = this.config?.webhookSecret;
    if (!secret) return null;

    const rawBody = headers['x-raw-body'];
    const signature = headers['x-pco-webhooks-authenticity'];
    if (!rawBody || !signature) return null;

    // HMAC-SHA256 verify (timing-safe)
    const expected = createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      return null; // caller responds 401
    }

    // Replay protection: reject events older than 5 minutes
    const data = payload as {
      data: Array<{
        attributes: {
          created_at: string;
          name: string;
          payload: { data: { id: string; attributes: Record<string, unknown> } };
        };
      }>;
    };
    const event = data.data?.[0];
    if (!event) return { event: 'unknown', externalId: '', action: 'ignore' };

    const createdAt = new Date(event.attributes.created_at);
    if (Date.now() - createdAt.getTime() > 5 * 60 * 1000) {
      return { event: event.attributes.name, externalId: '', action: 'ignore' };
    }

    const eventName = event.attributes.name;
    const externalId = event.attributes.payload?.data?.id ?? '';

    // Only process subscribed events
    const SUBSCRIBED = ['person.created', 'person.updated', 'person.deleted'];
    if (!SUBSCRIBED.includes(eventName)) {
      return { event: eventName, externalId, action: 'ignore' };
    }

    if (eventName === 'person.deleted') {
      return { event: eventName, externalId, action: 'delete' };
    }

    // Map attributes to ChmsMember
    const attrs = event.attributes.payload?.data?.attributes ?? {};
    const member: ChmsMember = {
      externalId,
      firstName: String(attrs.first_name ?? ''),
      lastName: String(attrs.last_name ?? ''),
      email:
        (attrs as { primary_email_address?: { address?: string } })
          .primary_email_address?.address ?? null,
      phone: null,
      status: attrs.status === 'active' ? 'active' : 'inactive',
      raw: event.attributes.payload?.data as unknown as Record<string, unknown>,
    };

    return { event: eventName, externalId, action: 'upsert', member };
  }
}
