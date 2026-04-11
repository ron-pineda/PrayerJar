import {
  pgTable, pgEnum, uuid, text, boolean, integer, serial,
  timestamp, date, primaryKey, doublePrecision, uniqueIndex, jsonb,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const categoryEnum = pgEnum('category', [
  'health', 'family', 'financial', 'grief', 'gratitude',
  'guidance', 'relationships', 'work_career', 'spiritual_growth', 'other',
]);

export const prayerStatusEnum = pgEnum('prayer_status', ['active', 'answered', 'expired']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'someone_prayed', 'message_received', 'prayer_answered', 'badge_earned',
]);

export const badgeTypeEnum = pgEnum('badge_type', [
  'first_light', 'first_prayer',
  'intercessor_bronze', 'intercessor_silver', 'intercessor_gold',
  'encourager_bronze', 'encourager_silver', 'encourager_gold',
  'faithful', 'devoted', 'witness', 'testimony', 'community_builder',
]);

export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'dismissed']);

export const emailPreferenceEnum = pgEnum('email_preference', ['off', 'realtime', 'daily', 'weekly']);
export const activityLevelEnum = pgEnum('activity_level', ['new', 'active', 'power']);

// NextAuth required tables (users extended with app fields)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  currentStreak: integer('current_streak').default(0).notNull(),
  lastPrayedDate: date('last_prayed_date'),
  emailPreference: emailPreferenceEnum('email_preference').default('off').notNull(),
  notifyOnPrayed: boolean('notifyOnPrayed').default(true).notNull(),
  notifyOnMessage: boolean('notifyOnMessage').default(true).notNull(),
  notifyOnBadge: boolean('notifyOnBadge').default(true).notNull(),
  notifyOnDigest: boolean('notifyOnDigest').default(true).notNull(),
  quietHoursStart: integer('quietHoursStart'),
  quietHoursEnd: integer('quietHoursEnd'),
  quietHoursTimezone: text('quietHoursTimezone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  onboardingCompleted: boolean('onboardingCompleted').default(false).notNull(),
  preferredCategories: text('preferredCategories').array().default([]).notNull(),
  activityLevel: activityLevelEnum('activityLevel').default('new').notNull(),
});

export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }));

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }));

// App tables
export const prayers = pgTable('prayers', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  authorId: uuid('author_id').references(() => users.id),
  content: text('content').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  isUrgent: boolean('is_urgent').default(false).notNull(),
  category: categoryEnum('category').notNull(),
  tags: text('tags').array().default([]).notNull(),
  suggestedVerse: text('suggested_verse'),
  status: prayerStatusEnum('status').default('active').notNull(),
  testimony: text('testimony'),
  imageUrl: text('image_url'),
  prayerCount: integer('prayer_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  answeredAt: timestamp('answered_at'),
  followUpSentAt: timestamp('followUpSentAt'),
});

export const prayerInteractions = pgTable('prayer_interactions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  prayerId: uuid('prayer_id').notNull().references(() => prayers.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id),
  message: text('message'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  relatedPrayerId: uuid('related_prayer_id').references(() => prayers.id),
  relatedInteractionId: uuid('related_interaction_id').references(() => prayerInteractions.id),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: badgeTypeEnum('type').notNull(),
  awardedAt: timestamp('awarded_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  reporterId: uuid('reporter_id').references(() => users.id),
  prayerId: uuid('prayer_id').references(() => prayers.id),
  interactionId: uuid('interaction_id').references(() => prayerInteractions.id),
  reason: text('reason').notNull(),
  status: reportStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull(),
  count: integer('count').default(1).notNull(),
  windowStart: timestamp('window_start').defaultNow().notNull(),
});

export const salvationDecisions = pgTable('salvation_decisions', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid('user_id').references(() => users.id),
  name: text('name'),
  country: text('country'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Church Finder ---

export const savedChurches = pgTable(
  "saved_churches",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googlePlaceId: text("google_place_id").notNull(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    savedAt: timestamp("saved_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("saved_churches_user_place_idx").on(t.userId, t.googlePlaceId)]
);

export const churchClaims = pgTable("church_claims", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  googlePlaceId: text("google_place_id").notNull().unique(),
  claimedByUserId: uuid("claimed_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  churchEmail: text("church_email").notNull(),
  denomination: text("denomination"),
  worshipStyle: text("worship_style"),
  serviceTimes: jsonb("service_times").$type<
    { day: string; time: string; label: string }[]
  >(),
  website: text("website"),
  description: text("description"),
  verified: boolean("verified").notNull().default(false),
  verifyToken: text("verify_token"),
  verifyTokenExpiresAt: timestamp("verify_token_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const churchRecommendations = pgTable(
  "church_recommendations",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    googlePlaceId: text("google_place_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    denomination: text("denomination"),
    worshipStyle: text("worship_style"),
    note: text("note").notNull(),
    newcomerFriendly: boolean("newcomer_friendly").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("church_recommendations_user_place_idx").on(t.userId, t.googlePlaceId)]
);

export const churchSearchCache = pgTable("church_search_cache", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  radiusMiles: integer("radius_miles").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const welcomeDripStatus = pgTable('welcomeDripStatus', {
  userId: uuid('userId').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  email1SentAt: timestamp('email1SentAt'),
  email2SentAt: timestamp('email2SentAt'),
  email3SentAt: timestamp('email3SentAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
export type PrayerInteraction = typeof prayerInteractions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type SalvationDecision = typeof salvationDecisions.$inferSelect;
export type SavedChurch = typeof savedChurches.$inferSelect;
export type ChurchClaim = typeof churchClaims.$inferSelect;
export type ChurchRecommendation = typeof churchRecommendations.$inferSelect;
export type ChurchSearchCache = typeof churchSearchCache.$inferSelect;
export type WelcomeDripStatus = typeof welcomeDripStatus.$inferSelect;
export type CategoryValue = typeof categoryEnum.enumValues[number];
export type BadgeType = typeof badgeTypeEnum.enumValues[number];

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
