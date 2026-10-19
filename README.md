# Cutlink

A small sharing toolkit: short URLs with click counts, downloadable QR codes, and plain-text shares with expiration and read limits. Built from [STRUCTURE.md](STRUCTURE.md). The working name is Cutlink to match this repository.

## Local setup

Prerequisites: Bun 1.4+, Node.js 22.12+ (for Vite and browser tests), Docker Engine and Docker Compose.

```sh
bun install --frozen-lockfile
cp .env.example .env
# Edit .env: replace the password in POSTGRES_PASSWORD and both database URLs.
docker compose up -d --wait
bun run db:migrate
bun run dev:api
```

In a second terminal:

```sh
bun run dev:web
```

Open <http://localhost:5173>. The API runs on port 3000; interactive OpenAPI documentation is at <http://localhost:3000/openapi>. Root commands explicitly load the root `.env` for the API and migrations. Vite uses its own optional `apps/web/.env`; no database credentials are exposed to the browser.

If port 5432 is already in use, change `POSTGRES_PORT` and the port in both database URLs together. Changing `API_PORT` also requires changing `PUBLIC_BASE_URL` and `API_PROXY_TARGET` in `apps/web/.env`. If changing the frontend port, update `WEB_ORIGIN` and Vite's port together. Docker credentials initialize a new volume; changing the password later does not change an existing database user's password.

## Run everything in Docker

Only Docker Engine and Compose are required on the host; Bun and Node are installed inside the build images.

```sh
# On a fresh checkout only (keep your existing .env if you already have one):
cp .env.example .env
# Set a unique POSTGRES_PASSWORD in .env.
docker compose -f compose.docker.yml up -d --build --wait
```

Open <http://localhost:8080>. The frontend, API, redirects, and OpenAPI docs share that origin. Compose waits for PostgreSQL, runs migrations as a one-off service, then starts the API and Nginx. Database and API ports are internal to the Docker network. The Docker stack uses its own persistent database volume, separate from the database used by `docker-compose.yml` for native development.

This setup reads `POSTGRES_PASSWORD` and the optional `DOCKER_*` variables from `.env`. It builds the internal database URL automatically, so native-development `DATABASE_URL`, `API_PORT`, `WEB_ORIGIN`, and `PUBLIC_BASE_URL` values do not affect it. Passwords containing URL punctuation are supported. Secrets and local build outputs are excluded from image build contexts.

- `DOCKER_WEB_PORT`: host port, default `8080`.
- `DOCKER_PUBLIC_ORIGIN`: browser-facing origin used in generated links, default `http://localhost:8080`. Update this together with the port, or set it to your HTTPS origin behind a proxy.
- `DOCKER_BIND_ADDRESS`: host binding, default `127.0.0.1`. Use `0.0.0.0` to allow connections from other machines, and set the public origin to the address those machines use.

```sh
docker compose -f compose.docker.yml logs -f api web
docker compose -f compose.docker.yml ps -a
docker compose -f compose.docker.yml down
# After pulling changes, rebuild and apply any new migrations:
docker compose -f compose.docker.yml up -d --build --wait
```

`down` preserves database data. Do not add `--volumes` unless you intend to delete that data. An exited migration container with status 0 is expected. The API runs as the unprivileged Bun user; Nginx serves the production frontend bundle and proxies API/redirect requests without caching. Browser routes use an SPA fallback, while missing assets/API routes do not. All browser clients currently share Nginx's peer-IP creation quota (30/minute per endpoint); the existing trusted-proxy limitation below applies.

The image build follows the [Bun Docker guide](https://bun.sh/guides/ecosystem/docker), and routing uses Nginx's [proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html) and [static-file](https://docs.nginx.com/nginx/admin-guide/web-server/serving-static-content/) support.

## Configuration

| Variable            | Purpose                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD` | PostgreSQL initialization password; use a unique local value.                               |
| `POSTGRES_PORT`     | Localhost-only database port, defaults to 5432.                                             |
| `DATABASE_URL`      | PostgreSQL URL used by the API and migrations.                                              |
| `TEST_DATABASE_URL` | Dedicated database whose name ends in `_test`; required for API and browser tests.          |
| `API_PORT`          | API listening port, defaults to 3000.                                                       |
| `WEB_ORIGIN`        | Exact frontend origin, used for CORS and generated text-share URLs.                         |
| `PUBLIC_BASE_URL`   | Public API/redirect origin, used for generated short links.                                 |
| `VITE_API_BASE_URL` | Optional frontend variable; defaults to `/api/v1`. It is public and embedded at build time. |
| `API_PROXY_TARGET`  | Optional Vite development proxy target; defaults to `http://localhost:3000`.                |

Use HTTP(S) origins without credentials or paths for `WEB_ORIGIN` and `PUBLIC_BASE_URL`. Never commit `.env` files.

## Commands and tests

```sh
bun run typecheck       # API, frontend, shared types and browser test configuration
bun run build           # Vite production bundle and Bun server entry
bun run db:generate     # Generate a migration after changing Drizzle schemas
bun run db:migrate      # Apply committed migrations
```

Create the dedicated test database once (tests never truncate the development database):

```sh
docker compose exec -T postgres createdb -U cutlink cutlink_test
# Ensure TEST_DATABASE_URL in .env uses the same password/port and /cutlink_test.
bun run test:api        # Applies migrations to the test database automatically
bun run test:web        # Vitest + Testing Library
bun run test            # Both of the above
bunx playwright install chromium
bun run test:e2e        # Real Chromium flows, including decoding an exported QR PNG
```

Browser tests start their own servers on ports 3001 and 5174 against `TEST_DATABASE_URL`; run API tests once first to initialize migrations. Test servers stop automatically. Browser tests create records in the dedicated test database. Playwright screenshots and failure traces are in ignored `test-results/`.

Coverage includes invalid URLs, reserved/duplicate slugs, missing/expired resources, concurrent redirect counts, concurrent maximum reads, burn-after-read deletion, input limits, rate limiting, blocked deletion, safe rendering of hostile HTML, explicit text revelation without automatic retry, real browser navigation, theme persistence, mobile layout, API error states, and QR exports.

## Layout

```text
apps/api/src/
  config/             Validated environment
  db/                 PostgreSQL connection, schemas and committed migrations
  modules/links/      Route schemas → services → repositories
  modules/snippets/  Transactional text reads and sharing API
  plugins/            In-memory rate limiter
  lib/                Errors, cryptographic slugs and URL validation
  tests/              Bun integration tests against PostgreSQL
apps/web/src/
  app/                Router and TanStack Query provider
  components/         Shared layout, copy controls and feedback
  features/           Link/text API clients and QR generation
  pages/              Dashboard and feature pages
  lib/                API transport, browser-local history and form helpers
packages/shared/      Public TypeScript contracts and limits
tests/e2e/           Playwright browser flows
```

## API and behavior

- `GET /api/v1/health`: verifies the database connection.
- `POST /api/v1/links`: accepts `originalUrl`, optional `slug` and ISO `expiresAt`; returns a short URL.
- `GET /api/v1/links/:slug`: public link details.
- `GET /api/v1/links/:slug/stats`: total successful redirect requests.
- `GET /s/:slug`: uncached HTTP 302 redirect; atomically increments the counter.
- `POST /api/v1/snippets`: accepts `content`, optional `title`, `expiresAt`, `maxViews`, and `burnAfterRead`; returns a frontend share URL.
- `GET /api/v1/snippets/:slug`: consumes one successful retrieval. This endpoint must never be prefetched or automatically retried.

Requests and JSON responses have Elysia schemas and OpenAPI documentation. Errors use `{ "error": { "code": "…", "message": "…" } }`. Missing, expired and exhausted resources return 404. Invalid values return 400 or 422, duplicate slugs return 409, and throttled requests return 429 with `Retry-After`.

Generated short-link codes use 8 URL-safe characters (48 random bits), with database uniqueness constraints and collision retries. Text shares retain 22-character identifiers (128 random bits). Existing links remain valid. Custom slugs are normalized to lowercase. Destinations accept only HTTP(S), reject embedded credentials, and are never fetched by the backend. Links are publicly readable; slugs do not confer ownership.

Text reads lock their row in a transaction, check expiration after the lock, and increment the read count or delete burn-after-read content before returning. A successful **retrieval**, rather than a confirmed human viewing, consumes a read: a lost response still consumes it. A burn-after-read share permits exactly one retrieval and deletes its database row. HEAD requests cannot consume text. The frontend waits for an explicit Reveal action, never automatically refetches, and renders content as plain text. Anyone holding the URL can retrieve it and save a copy.

QR codes are generated entirely in the browser, with bounded input/dimensions, selectable correction levels, PNG/SVG downloads, and clipboard actions. Capacity depends on content and correction level; the UI reports over-capacity errors.

## MVP scope and deployment

There are no accounts, global listing endpoints, deletion endpoints, ownership claims, or event-level tracking. Recent items live only in browser storage (up to 20 items, no snippet bodies). Clearing that history does not delete server records. Authenticated management can be added later with nullable ownership foreign keys and migrations.

Creation is limited to 30 requests per minute per peer IP and endpoint. Limits are in memory, reset when the process restarts, and apply to one API process. Forwarded headers are deliberately not trusted: behind a reverse proxy, clients share the proxy's quota until a trusted proxy integration is configured. No IP or visitor-event history is written to PostgreSQL.

For production, serve `apps/web/dist` with an SPA fallback for frontend routes, proxy `/api/*` and `/s/*` to the Bun API, and set the public origins correctly. Never apply the SPA fallback or caching to API/redirect routes. Use HTTPS for clipboard support. Start the server with `bun --env-file=.env apps/api/dist/index.js` from the repository root after installing dependencies and applying migrations. The backend build keeps runtime dependencies external. SIGINT/SIGTERM stop the server and close the database pool.

PostgreSQL is bound only to localhost with a persistent volume and health check. Expired/exhausted records remain in the database, except burned shares; retention cleanup is deferred. Before a public launch, plan abuse handling, retention, backups, and rate limiting appropriate to your deployment. Historical analytics, accounts and cross-device history are outside this MVP.

Implementation references: [Elysia OpenAPI](https://elysiajs.com/plugins/openapi), [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql), and [Vite setup](https://vite.dev/guide/). Installed package versions and the committed Bun lockfile determine the reproducible dependency set.
