import type {
  ChmsAdapter,
  ChmsConfig,
  ChmsMember,
  ChmsGroup,
  ChmsWebhookResult,
} from '../ChmsAdapter';
import { db } from '@/db';
import { churches, chmsSyncJobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '@/lib/encrypt';

const PCO_TOKEN_URL = 'https://api.planningcenteronline.com/oauth/token';
const PCO_REVOKE_URL = 'https://api.planningcenteronline.com/oauth/revoke';

export class PlanningCenterAdapter implements ChmsAdapter {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private config: ChmsConfig | null = null;
  /** Set when connect() is called and stored so private helpers can read it. */
  private churchId: string | null = null;

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

    const config: ChmsConfig = {
      provider: 'planning-center',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt,
      connectedAt: new Date().toISOString(),
      groupsAvailable: true,
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
      // Attempt refresh
      await this.refreshAccessToken(this.churchId ?? '');
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
  // Stub methods — pj-s18-06
  // ─────────────────────────────────────────────────────────────

  async listMembers(_churchId: string): Promise<ChmsMember[]> {
    throw new Error('listMembers not yet implemented — pj-s18-06');
  }

  async listGroups(_churchId: string): Promise<ChmsGroup[]> {
    throw new Error('listGroups not yet implemented — pj-s18-06');
  }

  async syncMember(_churchId: string, _member: ChmsMember): Promise<void> {
    throw new Error('syncMember not yet implemented — pj-s18-06');
  }

  async pushPrayerSummary(
    _churchId: string,
    _externalMemberId: string,
    _summary: string
  ): Promise<void> {
    throw new Error('pushPrayerSummary not yet implemented — pj-s18-06');
  }

  async handleWebhook(
    _payload: unknown,
    _headers: Record<string, string>
  ): Promise<ChmsWebhookResult | null> {
    throw new Error('handleWebhook not yet implemented — pj-s18-06');
  }
}
