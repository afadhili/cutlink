import { t } from 'elysia';
import { LIMITS } from '@cutlink/shared/constants';
export const createSnippetSchema = t.Object({ title: t.Optional(t.String({ maxLength: LIMITS.title })), content: t.String({ minLength: 1, maxLength: LIMITS.content }), expiresAt: t.Optional(t.String({ format: 'date-time' })), maxViews: t.Optional(t.Integer({ minimum: 1, maximum: 1_000_000 })), burnAfterRead: t.Optional(t.Boolean()) });
export const createdSnippetSchema = t.Object({ slug: t.String(), shareUrl: t.String() });
export const snippetSchema = t.Object({ title: t.Nullable(t.String()), content: t.String(), viewCount: t.Number(), maxViews: t.Nullable(t.Number()), burnAfterRead: t.Boolean() });
