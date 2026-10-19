export const LIMITS = {
  url: 4096,
  title: 200,
  content: 100_000,
  slug: 64,
  qr: 2000,
} as const;
export const RESERVED_SLUGS = new Set([
  "api",
  "s",
  "t",
  "links",
  "qr",
  "share",
  "health",
  "openapi",
  "admin",
  "assets",
]);
