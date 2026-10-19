import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, timestamp, bigint, index, check } from 'drizzle-orm/pg-core';
export const links = pgTable('links', {
  id: uuid().primaryKey().defaultRandom(),
  slug: varchar({ length: 64 }).notNull().unique(),
  originalUrl: text('original_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  clickCount: bigint('click_count', { mode: 'number' }).notNull().default(0),
}, t => [index('links_expiry_idx').on(t.expiresAt), check('links_click_count_valid', sql`${t.clickCount} >= 0`)]);
