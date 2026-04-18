export interface ChmsMember {
  externalId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: 'active' | 'inactive' | 'unknown';
  raw: Record<string, unknown>;
}

export interface ChmsGroup {
  externalId: string;
  name: string;
  description: string | null;
  memberExternalIds: string[];
  raw: Record<string, unknown>;
}

export interface ChmsWebhookResult {
  event: string;
  externalId: string;
  action: 'upsert' | 'delete' | 'ignore';
  member?: ChmsMember;
}

export type ChmsProviderSlug = 'planning-center' | 'breeze';

export interface ChmsConfig {
  provider: ChmsProviderSlug;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  apiKey?: string;
  subdomain?: string;
  webhookSecret?: string;
  connectedAt: string;
  lastSyncedAt?: string;
  groupsAvailable?: boolean;
}

export interface ChmsAdapter {
  connect(config: ChmsConfig): Promise<void>;
  disconnect(churchId: string): Promise<void>;
  listMembers(churchId: string): Promise<ChmsMember[]>;
  listGroups(churchId: string): Promise<ChmsGroup[]>;
  syncMember(churchId: string, member: ChmsMember): Promise<void>;
  pushPrayerSummary(churchId: string, externalMemberId: string, summary: string): Promise<void>;
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<ChmsWebhookResult | null>;
}
