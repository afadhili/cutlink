import { eq, sql } from "drizzle-orm";
import type { Database } from "../../db";
import { snippets } from "../../db/schema";
export function snippetsRepository(db: Database) {
  return {
    async create(values: typeof snippets.$inferInsert) {
      return (await db.insert(snippets).values(values).returning())[0]!;
    },
    async read(slug: string) {
      return db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(snippets)
          .where(eq(snippets.slug, slug))
          .for("update");
        if (!row) return undefined;
        // Check wall time after acquiring the lock, not transaction start time.
        const [{ now }] = await tx.execute<{ now: Date }>(
          sql`select clock_timestamp() as now`,
        );
        if (
          (row.expiresAt &&
            row.expiresAt.getTime() <= new Date(now!).getTime()) ||
          (row.maxViews !== null && row.viewCount >= row.maxViews)
        )
          return undefined;
        const result = {
          title: row.title,
          content: row.content,
          viewCount: row.viewCount + 1,
          maxViews: row.maxViews,
          burnAfterRead: row.burnAfterRead,
        };
        if (row.burnAfterRead)
          await tx.delete(snippets).where(eq(snippets.id, row.id));
        else
          await tx
            .update(snippets)
            .set({ viewCount: row.viewCount + 1 })
            .where(eq(snippets.id, row.id));
        return result;
      });
    },
  };
}
