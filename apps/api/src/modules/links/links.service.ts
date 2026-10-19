import type { CreateLink, LinkResource } from "@cutlink/shared";
import type { linksRepository } from "./links.repository";
import { AppError, isUniqueViolation } from "../../lib/errors";
import { createLinkSlug } from "../../lib/ids";
import { normalizeUrl, normalizeSlug, parseExpiry } from "../../lib/urls";
type Repository = ReturnType<typeof linksRepository>;
export function linksService(repository: Repository, baseUrl: string) {
  const serialize = (
    row: Awaited<ReturnType<Repository["create"]>>,
  ): LinkResource => ({
    slug: row.slug,
    originalUrl: row.originalUrl,
    shortUrl: `${baseUrl}/s/${row.slug}`,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    clickCount: row.clickCount,
  });
  return {
    async create(input: CreateLink) {
      const originalUrl = normalizeUrl(input.originalUrl);
      const expiresAt = parseExpiry(input.expiresAt);
      const customSlug =
        input.slug === undefined ? undefined : normalizeSlug(input.slug);
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          return serialize(
            await repository.create({
              slug: customSlug ?? createLinkSlug(),
              originalUrl,
              expiresAt,
            }),
          );
        } catch (error) {
          if (!isUniqueViolation(error)) throw error;
          if (customSlug)
            throw new AppError(
              409,
              "SLUG_TAKEN",
              "That custom slug is already in use.",
            );
        }
      }
      throw new AppError(
        500,
        "SLUG_GENERATION_FAILED",
        "Could not create a link. Please try again.",
      );
    },
    async get(slug: string) {
      const row = await repository.find(slug);
      if (!row)
        throw new AppError(
          404,
          "LINK_UNAVAILABLE",
          "This link is missing or has expired.",
        );
      return serialize(row);
    },
    async redirect(slug: string) {
      const row = await repository.redirect(slug);
      if (!row)
        throw new AppError(
          404,
          "LINK_UNAVAILABLE",
          "This link is missing or has expired.",
        );
      return row.originalUrl;
    },
  };
}
