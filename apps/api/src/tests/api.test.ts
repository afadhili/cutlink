import { afterAll, beforeAll, expect, test } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { links, snippets } from '../db/schema';
import { app, config, connection, db, request, setup } from './helpers';
import { createApp } from '../app';
const slugs: string[] = [];
const snippetSlugs: string[] = [];
beforeAll(setup);
afterAll(async () => { if (slugs.length) await db.delete(links).where(inArray(links.slug, slugs)); if (snippetSlugs.length) await db.delete(snippets).where(inArray(snippets.slug, snippetSlugs)); await connection.close(); });
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
async function createSnippet(body: object) { const response = await request('/api/v1/snippets', 'POST', body); const data = await response.json(); if (data.slug) snippetSlugs.push(data.slug); return { response, data }; }
test('shares preserve multiline and hostile HTML as plain JSON text', async () => {
  const content = '<script>alert(1)</script>\nhello';
  const { response, data } = await createSnippet({ title: 'Code', content });
  expect(response.status).toBe(201); expect(data.shareUrl).toBe(`${config.webOrigin}/t/${data.slug}`);
  const read = await request(`/api/v1/snippets/${data.slug}`);
  expect(read.headers.get('cache-control')).toBe('no-store');
  expect((await read.json()).content).toBe(content);
  expect((await request(`/api/v1/snippets/${data.slug}`, 'DELETE')).status).toBe(404);
});
test('concurrent reads cannot exceed max views', async () => {
  const { data } = await createSnippet({ content: 'Only three reads', maxViews: 3 });
  const reads = await Promise.all(Array.from({ length: 20 }, () => request(`/api/v1/snippets/${data.slug}`)));
  expect(reads.filter(r => r.status === 200)).toHaveLength(3);
  expect(reads.filter(r => r.status === 404)).toHaveLength(17);
  const [row] = await db.select().from(snippets).where(eq(snippets.slug, data.slug));
  expect(row?.viewCount).toBe(3);
});
test('burn after read returns content once and removes it from PostgreSQL', async () => {
  const { data } = await createSnippet({ content: 'One time', burnAfterRead: true });
  expect((await request(`/api/v1/snippets/${data.slug}`, 'HEAD')).status).toBe(405);
  const reads = await Promise.all(Array.from({ length: 15 }, () => request(`/api/v1/snippets/${data.slug}`)));
  expect(reads.filter(r => r.status === 200)).toHaveLength(1);
  expect(reads.filter(r => r.status === 404)).toHaveLength(14);
  expect(await db.select().from(snippets).where(eq(snippets.slug, data.slug))).toHaveLength(0);
});
test('expired snippets cannot be consumed and malformed shares are rejected', async () => {
  const { data } = await createSnippet({ content: 'Expired' });
  await db.update(snippets).set({ expiresAt: new Date(0) }).where(eq(snippets.slug, data.slug));
  expect((await request(`/api/v1/snippets/${data.slug}`)).status).toBe(404);
  expect((await createSnippet({ content: ' ' })).response.status).toBe(400);
  expect((await createSnippet({ content: 'Hi', maxViews: 0 })).response.status).toBe(422);
  expect((await createSnippet({ content: 'Hi', maxViews: 1.5 })).response.status).toBe(422);
  expect((await createSnippet({ content: 'x'.repeat(100001) })).response.status).toBe(422);
  expect((await request('/api/v1/snippets')).status).toBe(404);
});
