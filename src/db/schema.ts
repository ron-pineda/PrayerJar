import {
  pgTable, pgEnum, uuid, text, boolean, integer,
  timestamp, date, primaryKey,
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
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

export type User = typeof users.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
export type PrayerInteraction = typeof prayerInteractions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type CategoryValue = typeof categoryEnum.enumValues[number];
export type BadgeType = typeof badgeTypeEnum.enumValues[number];
