import { t } from "elysia";
import { LIMITS } from "@cutlink/shared/constants";
export const slugParams = t.Object({
  slug: t.String({
    minLength: 1,
    maxLength: LIMITS.slug,
    pattern: "^[a-zA-Z0-9_-]+$",
  }),
});
export const createLinkSchema = t.Object({
  originalUrl: t.String({ minLength: 1, maxLength: LIMITS.url }),
  slug: t.Optional(t.String({ minLength: 3, maxLength: LIMITS.slug })),
  expiresAt: t.Optional(t.String({ format: "date-time" })),
});
export const linkSchema = t.Object({
  slug: t.String(),
  originalUrl: t.String(),
  shortUrl: t.String(),
  createdAt: t.String(),
  expiresAt: t.Nullable(t.String()),
  clickCount: t.Number(),
});
export const statsSchema = t.Object({
  slug: t.String(),
  clickCount: t.Number(),
});
