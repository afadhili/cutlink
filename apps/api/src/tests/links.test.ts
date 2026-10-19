import { afterAll, beforeAll, expect, test } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { links } from '../db/schema';
import { app, config, connection, db, request, setup } from './helpers';
import { createApp } from '../app';
const slugs: string[] = [];
beforeAll(setup);
afterAll(async () => { if (slugs.length) await db.delete(links).where(inArray(links.slug, slugs)); await connection.close(); });
async function create(body: object) { const response = await request('/api/v1/links', 'POST', body); const data = await response.json(); if (data.slug) slugs.push(data.slug); return { response, data }; }
test('health checks PostgreSQL and OpenAPI describes the API', async () => {
  expect((await request('/api/v1/health')).status).toBe(200);
  expect((await request('/openapi/json')).status).toBe(200);
});
test('creates, redirects and increments clicks atomically', async () => {
  const { response, data } = await create({ originalUrl: 'https://example.com/a?x=1' });
  expect(response.status).toBe(201);
  const redirects = await Promise.all(Array.from({ length: 10 }, () => request(`/s/${data.slug}`)));
  for (const redirect of redirects) { expect(redirect.status).toBe(302); expect(redirect.headers.get('location')).toBe('https://example.com/a?x=1'); expect(redirect.headers.get('cache-control')).toBe('no-store'); }
  expect(await (await request(`/api/v1/links/${data.slug}/stats`)).json()).toEqual({ slug: data.slug, clickCount: 10 });
});
test('normalizes custom slugs and rejects collisions', async () => {
  const slug = `test-${crypto.randomUUID()}`;
  expect((await create({ originalUrl: 'https://example.com', slug: slug.toUpperCase() })).data.slug).toBe(slug);
  expect((await create({ originalUrl: 'https://example.com', slug })).response.status).toBe(409);
});
test('rejects unsafe URLs, credentials, reserved slugs, past expiry and malformed bodies', async () => {
  for (const originalUrl of ['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'ftp://example.com', 'https://user:pass@example.com', 'invalid']) expect((await create({ originalUrl })).response.status).toBe(400);
  expect((await create({ originalUrl: 'https://example.com', slug: 'api' })).response.status).toBe(400);
  expect((await create({ originalUrl: 'https://example.com', expiresAt: '2020-01-01T00:00:00Z' })).response.status).toBe(400);
  expect((await create({ originalUrl: 'x'.repeat(4097) })).response.status).toBe(422);
});
test('expired and missing links do not redirect', async () => {
  const { data } = await create({ originalUrl: 'https://example.com' });
  await db.update(links).set({ expiresAt: new Date(0) }).where(eq(links.slug, data.slug));
  expect((await request(`/s/${data.slug}`)).status).toBe(404);
  expect((await request(`/api/v1/links/${data.slug}`)).status).toBe(404);
  expect((await request('/s/no-such-link')).status).toBe(404);
});
test('no global listing or unauthenticated deletion', async () => {
  const { data } = await create({ originalUrl: 'https://example.com' });
  expect((await request('/api/v1/links')).status).toBe(404);
  expect((await request(`/api/v1/links/${data.slug}`, 'DELETE')).status).toBe(404);
  expect((await request(`/api/v1/links/${data.slug}`)).status).toBe(200);
});
test('rate limits creation and returns a retry interval', async () => {
  const limited = createApp(db, config, { rateLimit: 1 });
  // Invalid URLs exercise the middleware without creating persistent resources.
  expect((await request('/api/v1/links', 'POST', { originalUrl: 'invalid' }, limited)).status).toBe(400);
  const response = await request('/api/v1/links', 'POST', { originalUrl: 'invalid' }, limited);
  expect(response.status).toBe(429); expect(response.headers.get('retry-after')).toBe('60');
});
