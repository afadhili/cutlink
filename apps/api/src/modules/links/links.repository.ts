import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { Database } from "../../db";
import { links } from "../../db/schema";
export function linksRepository(db: Database) {
  const active = (slug: string) =>
    and(
      eq(links.slug, slug),
      or(isNull(links.expiresAt), sql`${links.expiresAt} > now()`),
    );
  return {
    async create(values: typeof links.$inferInsert) {
      return (await db.insert(links).values(values).returning())[0]!;
    },
    async find(slug: string) {
      return (await db.select().from(links).where(active(slug)).limit(1))[0];
    },
    async redirect(slug: string) {
      return (
        await db
          .update(links)
          .set({ clickCount: sql`${links.clickCount} + 1` })
          .where(active(slug))
          .returning()
      )[0];
    },
  };
}
