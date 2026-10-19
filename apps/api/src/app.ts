import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { sql } from 'drizzle-orm';
import type { Database } from './db';
import type { Config } from './config/env';
import { AppError, errorResponses } from './lib/errors';
import { createRateLimiter } from './plugins/rate-limit';
import { linksRepository } from './modules/links/links.repository';
import { linksService } from './modules/links/links.service';
import { linksRoutes } from './modules/links/links.routes';
export function createApp(db: Database, config: Config, options: { rateLimit?: number } = {}) {
  const rateLimit = createRateLimiter(options.rateLimit);
  return new Elysia()
    .onError(({ code, error, set }) => {
      if (error instanceof AppError) { set.status = error.status; return { error: { code: error.code, message: error.message } }; }
      const status = code === 'VALIDATION' ? 422 : code === 'NOT_FOUND' ? 404 : code === 'PARSE' ? 400 : 500;
      set.status = status;
      return { error: { code: status === 500 ? 'INTERNAL_ERROR' : String(code), message: status === 500 ? 'Something went wrong. Please try again.' : status === 404 ? 'Resource not found.' : 'Please check your request fields.' } };
    })
    .onRequest(({ request, set }) => {
      set.headers['Cache-Control'] = 'no-store';
      set.headers['X-Content-Type-Options'] = 'nosniff';
      set.headers['Referrer-Policy'] = 'no-referrer';
      if (request.method === 'HEAD' && new URL(request.url).pathname.startsWith('/api/v1/snippets/')) return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    })
    .use(cors({ origin: config.webOrigin, methods: ['GET', 'POST', 'OPTIONS'] }))
    .onBeforeHandle(({ request, server, set }) => {
      if (request.method !== 'POST') return;
      // Forwarded headers are untrusted. Deploy directly or supply a trusted proxy adapter.
      const ip = server?.requestIP(request)?.address ?? 'local';
      const retry = rateLimit(`${ip}:${new URL(request.url).pathname}`);
      if (retry) { set.headers['Retry-After'] = String(retry); throw new AppError(429, 'RATE_LIMITED', 'Too many requests. Please try again in a minute.'); }
    })
    .use(openapi({ documentation: { info: { title: 'Cutlink API', version: '1.0.0' } } }))
    .get('/api/v1/health', async () => { await db.execute(sql`select 1`); return { status: 'ok' as const }; }, { response: { 200: t.Object({ status: t.Literal('ok') }), ...errorResponses } })
    .use(linksRoutes(linksService(linksRepository(db), config.publicBaseUrl)));
}
