import type { CreateSnippet } from '@cutlink/shared';
import type { snippetsRepository } from './snippets.repository';
import { AppError, isUniqueViolation } from '../../lib/errors';
import { createSlug } from '../../lib/ids';
import { parseExpiry } from '../../lib/urls';
export function snippetsService(repository: ReturnType<typeof snippetsRepository>, webOrigin: string) {
  return {
    async create(input: CreateSnippet) {
      if (!input.content.trim()) throw new AppError(400, 'EMPTY_CONTENT', 'Enter some text to share.');
      const expiresAt = parseExpiry(input.expiresAt);
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const row = await repository.create({ slug: createSlug(), title: input.title?.trim() || null, content: input.content, expiresAt, maxViews: input.burnAfterRead ? 1 : input.maxViews ?? null, burnAfterRead: input.burnAfterRead ?? false });
          return { slug: row.slug, shareUrl: `${webOrigin}/t/${row.slug}` };
        } catch (error) { if (!isUniqueViolation(error)) throw error; }
      }
      throw new AppError(500, 'SLUG_GENERATION_FAILED', 'Could not create a text share. Please try again.');
    },
    async read(slug: string) {
      const row = await repository.read(slug);
      if (!row) throw new AppError(404, 'SHARE_UNAVAILABLE', 'This share is missing, expired, or has reached its read limit.');
      return row;
    },
  };
}
