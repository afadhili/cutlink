import { LIMITS, RESERVED_SLUGS } from "@cutlink/shared/constants";
import { AppError } from "./errors";
export function normalizeUrl(input: string) {
  try {
    const url = new URL(input.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.href.length > LIMITS.url
    )
      throw new Error();
    return url.href;
  } catch {
    throw new AppError(
      400,
      "INVALID_URL",
      "Enter a valid HTTP or HTTPS URL without credentials.",
    );
  }
}
export function normalizeSlug(input: string) {
  const slug = input.trim().toLowerCase();
  if (!/^[a-z0-9_-]{3,64}$/.test(slug) || RESERVED_SLUGS.has(slug))
    throw new AppError(
      400,
      "INVALID_SLUG",
      "Use 3–64 letters, numbers, hyphens or underscores, and avoid reserved names.",
    );
  return slug;
}
export function parseExpiry(input?: string) {
  if (!input) return null;
  const date = new Date(input);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
    throw new AppError(
      400,
      "INVALID_EXPIRY",
      "Expiration must be in the future.",
    );
  return date;
}
