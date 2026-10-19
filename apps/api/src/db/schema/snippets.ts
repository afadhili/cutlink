import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, integer, boolean, index, check } from 'drizzle-orm/pg-core';
export const snippets = pgTable('snippets', {
  id: uuid().primaryKey().defaultRandom(),
  slug: varchar({ length: 64 }).notNull().unique(),
  title: varchar({ length: 200 }),
  content: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  maxViews: integer('max_views'),
  viewCount: integer('view_count').notNull().default(0),
  burnAfterRead: boolean('is_burn_after_read').notNull().default(false),
}, t => [index('snippets_expiry_idx').on(t.expiresAt), check('snippets_views_valid', sql`${t.viewCount} >= 0 AND (${t.maxViews} IS NULL OR (${t.maxViews} > 0 AND ${t.viewCount} <= ${t.maxViews}))`)]);
