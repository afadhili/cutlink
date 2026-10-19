Use this as a master prompt for an LLM coding agent. It defines the application architecture, folder structure, database schema, API contracts, security requirements, and implementation order so the agent builds a coherent application rather than generating disconnected features.

The stack is React + TypeScript for the frontend, Elysia + TypeScript for the backend, PostgreSQL in Docker, and Drizzle ORM for database access. The app combines three tools: a URL shortener, a QR code generator, and a text-sharing service.

# 1. Project overview

[URL Shortener & Link Analytics (QR) - Free | 8gwifi.org](https://images.openai.com/static-rsc-4/mX_PtiDKdqLaRJwQ37a_HR_gYvseNZX-yh84BxMzeHEKgAG-qYdW3sFNlnHkUHPcnfsJ6PijgQJhh3btE-HYyuWXFArEN099tMz0cK1vO0b7Ax-9AE4D3H5U55MeQcbAGvml5rfGouC4KPyK_1vC0vuYe471B1ctolHDuSHG3tQ?purpose=inline)

Link shortener

Create short URLs, support custom slugs, redirect visitors, and track basic click statistics.

[Free QR Code Generator - Create Custom QR Codes](https://images.openai.com/static-rsc-4/bPvLYG3zANUOYNRAuiEbegTb2bBe6zVmIhXpCI9WvSKC7jwwv4v1o8Iq5eYiAycm8naV_nB-qqdGDQl2QIcUgz8CqPEZGLXtDXqRpXrLSEb2GO2F3F9q6KW-1My_pgzcUMfIjfR4OvPzOKycZ3SPPweCCMLL2rdtX_CG3jV72Zg?purpose=inline)

QR code generator

Generate QR codes for URLs or arbitrary text, preview them, and download them as PNG or SVG.

[Designing Pastebin. Let’s design a web service to store… | by Crack FAANG | CodeX | Medium](https://images.openai.com/static-rsc-4/Fx8nhT7XBghxMV7KCz6HShDQiJNEk3Bya7giSc5L__IsL6F2yU0wnArBaNLZHMi2YdEOo3aDsGG5P08J7mPVf6JpDYHtmb0utkuG5vdhLz2ZXNt5KvX7PlMbFKsZIleE11yKoZitzXCaHoucMZTQvE29Jh-UpXjvhdMwIEHThHo?purpose=inline)

Text sharing

Share code snippets, notes, or plain text through unique URLs, with optional expiration and read limits.

Initial scope: no login or user accounts. All three tools should work immediately, with no authentication required. Use anonymous resource identifiers and server-side rate limits. Design the database so user ownership can be added later without rewriting the entire application.

# 2. Recommended technology stack

| Layer               | Technology                                        |
| ------------------- | ------------------------------------------------- |
| Frontend            | React, TypeScript, Vite                           |
| Routing             | React Router                                      |
| Server state        | TanStack Query                                    |
| Styling             | Tailwind CSS                                      |
| UI components       | shadcn/ui, selectively                            |
| Backend             | Elysia, TypeScript, Bun                           |
| Validation          | Elysia TypeBox / `t` schemas                      |
| Database            | PostgreSQL                                        |
| ORM                 | Drizzle ORM                                       |
| Migrations          | Drizzle Kit                                       |
| Database deployment | Docker Compose                                    |
| QR generation       | `qrcode`                                          |
| Frontend forms      | React Hook Form + Zod where useful                |
| Testing             | Vitest, Testing Library, Elysia integration tests |
| API documentation   | Elysia Swagger / OpenAPI                          |

Keep validation authoritative on the backend, even if the frontend also validates input. Avoid adding Redis, microservices, or a separate worker initially; PostgreSQL and one Elysia server are sufficient for this scope.

# 3. Project folder structure

Use a monorepo with separate frontend and backend applications. Bun workspaces keep dependencies and scripts manageable.

```
linkspace/
├── apps/
│   ├── web/                         # React frontend
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── router.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── layout/
│   │   │   │   └── shared/
│   │   │   ├── features/
│   │   │   │   ├── links/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── api.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── qr/
│   │   │   │   └── snippets/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts
│   │   │   │   └── utils.ts
│   │   │   ├── pages/
│   │   │   │   ├── home.tsx
│   │   │   │   ├── links.tsx
│   │   │   │   ├── qr-generator.tsx
│   │   │   │   ├── text-share.tsx
│   │   │   │   ├── snippet-view.tsx
│   │   │   │   └── not-found.tsx
│   │   │   ├── styles/
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                         # Elysia backend
│       ├── src/
│       │   ├── config/
│       │   │   └── env.ts
│       │   ├── db/
│       │   │   ├── index.ts
│       │   │   ├── schema/
│       │   │   │   ├── links.ts
│       │   │   │   ├── snippets.ts
│       │   │   │   └── index.ts
│       │   │   └── migrations/
│       │   ├── modules/
│       │   │   ├── links/
│       │   │   │   ├── links.routes.ts
│       │   │   │   ├── links.service.ts
│       │   │   │   ├── links.repository.ts
│       │   │   │   └── links.schema.ts
│       │   │   ├── qr/
│       │   │   │   ├── qr.routes.ts
│       │   │   │   └── qr.service.ts
│       │   │   └── snippets/
│       │   │       ├── snippets.routes.ts
│       │   │       ├── snippets.service.ts
│       │   │       ├── snippets.repository.ts
│       │   │       └── snippets.schema.ts
│       │   ├── plugins/
│       │   │   ├── cors.ts
│       │   │   ├── rate-limit.ts
│       │   │   └── swagger.ts
│       │   ├── lib/
│       │   │   ├── errors.ts
│       │   │   ├── ids.ts
│       │   │   └── urls.ts
│       │   ├── app.ts
│       │   └── index.ts
│       ├── drizzle.config.ts
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── shared/                      # Shared types/constants
│       ├── src/
│       │   ├── types.ts
│       │   └── constants.ts
│       └── package.json
│
├── docker-compose.yml
├── package.json
├── bun.lock
├── .env.example
├── .gitignore
└── README.md
```

Keep business logic in services, database operations in repositories, and HTTP handling in route files. For QR generation, the backend should validate requests and enforce limits; the frontend can generate downloadable QR images locally.

# 4. Database design

Use three main tables initially.

## `links`

| Column         | Type                  | Purpose                    |
| -------------- | --------------------- | -------------------------- |
| `id`           | UUID, primary key     | Internal identifier        |
| `slug`         | VARCHAR(64), unique   | Public short code          |
| `original_url` | TEXT                  | Destination URL            |
| `created_at`   | TIMESTAMPTZ           | Creation timestamp         |
| `expires_at`   | TIMESTAMPTZ, nullable | Optional expiry            |
| `click_count`  | BIGINT                | Total successful redirects |

## `snippets`

| Column               | Type                   | Purpose                                |
| -------------------- | ---------------------- | -------------------------------------- |
| `id`                 | UUID, primary key      | Internal identifier                    |
| `slug`               | VARCHAR(64), unique    | Public sharing identifier              |
| `title`              | VARCHAR(200), nullable | Optional title                         |
| `content`            | TEXT                   | Shared text                            |
| `created_at`         | TIMESTAMPTZ            | Creation timestamp                     |
| `expires_at`         | TIMESTAMPTZ, nullable  | Optional expiry                        |
| `max_views`          | INTEGER, nullable      | Optional read limit                    |
| `view_count`         | INTEGER                | Number of successful reads             |
| `is_burn_after_read` | BOOLEAN                | Delete after the first successful read |

## `link_clicks` (optional for MVP)

| Column       | Type              | Purpose             |
| ------------ | ----------------- | ------------------- |
| `id`         | BIGINT, identity  | Event identifier    |
| `link_id`    | UUID, foreign key | Associated link     |
| `clicked_at` | TIMESTAMPTZ       | Click timestamp     |
| `referer`    | TEXT, nullable    | Referring site      |
| `user_agent` | TEXT, nullable    | Browser information |

For the first version, `click_count` alone is enough if you only need total clicks. Add `link_clicks` when you need historical analytics.

Important database rules:

- Index unique slugs and expiration timestamps.
- Use database constraints for valid counter values.
- Use transactions when enforcing view limits or burn-after-read behavior.
- Use a database migration workflow; do not rely on automatic schema synchronization in production.
- Never store passwords or authentication tokens because accounts are out of scope.

# 5. API design

Use `/api/v1` as the prefix for the versioned API.

| Method   | Endpoint                    | Purpose                                |
| -------- | --------------------------- | -------------------------------------- |
| `GET`    | `/api/v1/health`            | Health check                           |
| `POST`   | `/api/v1/links`             | Create a shortened URL                 |
| `GET`    | `/api/v1/links`             | List recent links on this installation |
| `GET`    | `/api/v1/links/:slug`       | Get link details                       |
| `DELETE` | `/api/v1/links/:slug`       | Delete a link                          |
| `GET`    | `/api/v1/links/:slug/stats` | Get click statistics                   |
| `GET`    | `/s/:slug`                  | Redirect to the destination            |
| `POST`   | `/api/v1/qr`                | Validate QR generation request         |
| `POST`   | `/api/v1/snippets`          | Create a text share                    |
| `GET`    | `/api/v1/snippets/:slug`    | Read shared text                       |
| `DELETE` | `/api/v1/snippets/:slug`    | Delete a text share                    |

QR codes do not need a database table for the MVP. Generate them on demand in the frontend using the supplied text or URL. The `/api/v1/qr` endpoint is optional if you decide all QR generation should be client-side.

Important: because there is no authentication, the link and snippet management endpoints must not be treated as private owner-only APIs. Either make management read-only and keep deletions behind an unguessable management token, or design a proper ownership mechanism before exposing destructive operations. Unauthenticated global listing is also a privacy and abuse risk; preferably omit it from the public API and use browser-local history for the MVP.

# 6. Frontend pages and user flows

## Home — `/`

A unified dashboard with three prominent tools: Shorten URL, Generate QR, and Share Text. Include a concise hero section and recent items stored locally in the browser.

## Link shortener — `/links`

URL input, optional custom slug, optional expiry, generated short URL, copy button, and success/error states.

## QR generator — `/qr`

URL or text input, live QR preview, configurable size and error correction, and PNG/SVG export.

## Text sharing — `/share`

Title and text editor, optional expiry, optional maximum views, burn-after-read option, and generated share URL.

## Shared text — `/t/:slug`

Display the shared content safely as plain text, with copy functionality and clear expired or unavailable states.

Design guidance: use a responsive, restrained interface with a dark/light theme, consistent spacing, accessible controls, loading states, toast notifications, and useful empty states. Avoid making every feature a separate disconnected mini-app.

# 7. Docker and environment setup

Use Docker Compose for PostgreSQL only at first. Run the React and Elysia development servers natively through Bun.

Example `docker-compose.yml`:

```
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: linkspace
      POSTGRES_USER: linkspace
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U linkspace -d linkspace"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Example root `.env.example`:

```
POSTGRES_PASSWORD=replace_with_a_local_password
DATABASE_URL=postgres://linkspace:replace_with_a_local_password@localhost:5432/linkspace
API_PORT=3000
WEB_ORIGIN=http://localhost:5173
PUBLIC_BASE_URL=http://localhost:3000
```

The root environment file is a template. Keep actual secrets in an ignored `.env` file, and load each application's required variables explicitly. Do not commit credentials.

# 8. Master prompt for the coding LLM

Copy the following prompt into your coding agent.

# Project: Linkspace — URL Shortener, QR Generator, and Text Sharing

You are a senior full-stack engineer. Build a complete, working application called Linkspace using the requirements below. Work directly in the project files when filesystem and terminal tools are available. Do not merely produce code snippets or a tutorial.

## 1. Technology stack

- Frontend: React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS.
- Backend: Elysia, TypeScript, Bun.
- Database: PostgreSQL running in Docker Compose.
- ORM and migrations: Drizzle ORM and Drizzle Kit.
- Validation: Elysia TypeBox schemas for backend request validation.
- QR generation: a maintained QR code library supporting PNG and SVG output.
- Testing: Vitest and appropriate frontend/backend integration tests.
- API documentation: Elysia Swagger/OpenAPI.

Use Bun as the package manager and runtime. Use a Bun workspace monorepo with `apps/web`, `apps/api`, and `packages/shared`.

Check package compatibility before installing dependencies. Use current stable versions compatible with the chosen stack and commit the lockfile.

## 2. Product requirements

The application must provide three independent tools:

### A. URL shortener

- Accept a destination URL.
- Validate URLs on the backend.
- Generate collision-resistant, URL-safe short slugs.
- Allow optional custom slugs.
- Reject reserved paths, invalid characters, and duplicate slugs.
- Allow optional expiration timestamps.
- Redirect valid slugs using HTTP 302.
- Return a clear 404 for unknown or expired links.
- Track total successful redirects.
- Provide a copyable short URL and basic statistics.
- Prevent redirects to schemes such as `javascript:`, `data:`, and `file:`.
- Do not fetch destination URLs from the backend.

### B. QR code generator

- Accept a URL or arbitrary text.
- Generate a QR code with a live preview.
- Support configurable dimensions and error-correction level.
- Allow PNG and SVG export.
- Provide copy and download actions where supported.
- Validate input length and dimensions.
- Generate QR images in the browser for the MVP; do not store image files in PostgreSQL.
- Allow QR codes to encode generated short URLs.

### C. Text-sharing service

- Accept a text title and body.
- Generate an unguessable public slug.
- Allow plain-text content, including source code and multiline text.
- Support optional expiration, maximum view count, and burn-after-read behavior.
- Provide a public share URL.
- Display shared content with safe plain-text rendering.
- Never render submitted content as executable HTML.
- Return clear errors for expired, missing, or exhausted shares.
- Enforce read limits atomically to avoid race conditions.

## 3. Authentication and ownership

Do not implement user accounts in the MVP.

Do not pretend that a public slug is authentication. Anyone who obtains a public sharing URL may be able to read its content.

Do not expose unrestricted global resource listing or destructive operations for arbitrary users. Use browser-local history for recent items. For deletion or private management, either implement an unguessable management token that is never included in public resource responses, or defer management until proper authentication is implemented.

Keep the database design extensible for future user accounts.

## 4. Architecture and code organization

Frontend:

- `src/app`: router and application providers.
- `src/components/ui`: reusable interface components.
- `src/components/layout`: navigation and page layout.
- `src/features/links`: URL shortener UI, hooks, API functions, and types.
- `src/features/qr`: QR generator UI and export functions.
- `src/features/snippets`: text editor, sharing UI, and API functions.
- `src/pages`: route-level pages.
- `src/lib`: API client and utilities.

Backend:

- `src/config`: validated environment configuration.
- `src/db`: Drizzle client, schema, and migrations.
- `src/modules/links`: routes, services, repositories, and validation schemas.
- `src/modules/qr`: optional server-side QR validation endpoint.
- `src/modules/snippets`: routes, services, repositories, and validation schemas.
- `src/plugins`: CORS, rate limiting, and Swagger.
- `src/lib`: shared backend utilities.
- `src/app.ts`: compose and export the Elysia application.
- `src/index.ts`: start the server.

Keep HTTP routes thin. Put business rules in services and database access in repositories. Avoid giant files, duplicate validation, unnecessary abstractions, and circular dependencies.

## 5. Database

Use PostgreSQL with Drizzle ORM.

Create these tables:

`links`

- UUID primary key.
- Unique slug with a maximum length of 64 characters.
- Destination URL.
- Creation timestamp.
- Nullable expiration timestamp.
- Total click count.

`snippets`

- UUID primary key.
- Unique slug.
- Nullable title with a maximum length of 200 characters.
- Text content.
- Creation timestamp.
- Nullable expiration timestamp.
- Nullable maximum view count.
- Current view count.
- Burn-after-read flag.

Optionally add `link_clicks` for event-level analytics.

Add appropriate indexes, foreign keys, unique constraints, and counter constraints.

Use migrations to create and evolve the schema. Do not use production schema auto-push as a substitute for migrations.

Implement expiration and maximum-view enforcement in the backend. Use transactions and appropriate row-level locking or conditional SQL updates to prevent concurrent requests from bypassing read limits. Define and test burn-after-read semantics explicitly.

## 6. API

Use `/api/v1` for JSON API endpoints.

Implement:

- `GET /api/v1/health`
- `POST /api/v1/links`
- `GET /api/v1/links/:slug`
- `GET /api/v1/links/:slug/stats`
- `DELETE /api/v1/links/:slug` only with appropriate authorization
- `GET /s/:slug` for short-link redirects
- `POST /api/v1/snippets`
- `GET /api/v1/snippets/:slug`
- `DELETE /api/v1/snippets/:slug` only with appropriate authorization
- `GET /t/:slug` as a frontend route, not an API route
- An optional QR validation endpoint if server-side QR processing is needed.

Do not expose public listing endpoints that disclose every user's resources. Do not add endpoints that the frontend does not need.

Define request and response schemas, consistent error responses, suitable HTTP status codes, and API documentation. Avoid returning stack traces or internal database errors to clients.

## 7. Security and reliability

- Validate all external inputs on the backend.
- Configure CORS using an explicit allowed-origin environment variable.
- Add per-IP and per-endpoint rate limiting for resource creation and expensive operations.
- Limit URL, title, slug, and text lengths.
- Validate and normalize custom slugs.
- Generate unpredictable identifiers using cryptographically secure randomness.
- Handle unique-constraint violations without exposing database internals.
- Avoid SQL injection by using Drizzle parameterized queries.
- Render shared text as plain text.
- Do not store unnecessary IP addresses or sensitive tracking information.
- Avoid collecting full user-agent and referrer histories unless analytics explicitly require them.
- Use a PostgreSQL health check and persistent Docker volume.
- Keep secrets out of Git.
- Configure graceful shutdown and database connection cleanup.
- Add tests for expired resources, duplicate slugs, invalid URLs, concurrent read limits, and unauthorized deletion.

## 8. Frontend design

Create a polished, responsive application with a unified dashboard and three feature pages.

Routes:

- `/` — dashboard.
- `/links` — URL shortener.
- `/qr` — QR generator.
- `/share` — text-sharing form.
- `/t/:slug` — public text viewer.

Include:

- Responsive navigation.
- Dark and light themes.
- Accessible form labels.
- Clear validation messages.
- Loading, error, success, empty, and expired states.
- Copy-to-clipboard actions with fallback handling.
- Downloadable QR images.
- A confirmation step for destructive actions.
- Browser-local recent-item history.
- Reusable components and consistent spacing and typography.

Use TanStack Query for server state and cache invalidation. Keep ephemeral UI state local. Do not add global state libraries unless a concrete requirement justifies them.

Never fabricate success when an API request fails. Show meaningful errors and allow users to retry.

## 9. Docker and environment

Create:

- `docker-compose.yml` for PostgreSQL.
- `.env.example` files.
- Root Bun workspace configuration.
- Package scripts for development, builds, type checking, tests, and migrations.
- A README containing setup instructions.

The initial development workflow should be:

1. Install dependencies using Bun.
2. Copy `.env.example` to `.env` and configure local values.
3. Start PostgreSQL with Docker Compose.
4. Run Drizzle migrations.
5. Start the Elysia backend.
6. Start the Vite frontend.

Bind PostgreSQL's development port to localhost by default. Use a persistent volume and a health check. Do not expose the database publicly.

## 10. Testing and acceptance criteria

The project is complete only when:

- The frontend and backend install and type-check successfully.
- PostgreSQL starts using Docker Compose.
- Migrations apply successfully to an empty database.
- A user can create a short link and follow its redirect.
- Invalid, missing, and expired links return the correct results.
- QR codes can be previewed and exported as PNG and SVG.
- Text shares can be created and viewed.
- Expiration and view limits are enforced server-side.
- Concurrent reads cannot exceed the configured view limit.
- Malicious HTML in shared text is displayed as text.
- Rate limits and input validation work.
- No unauthenticated user can arbitrarily delete resources.
- Automated tests cover core business rules.
- The README documents all commands and required environment variables.

## 11. Implementation workflow

Work in these phases:

Phase 1: Inspect the repository, establish the workspace, install compatible dependencies, and configure TypeScript and environment loading.

Phase 2: Set up Docker Compose, the PostgreSQL connection, Drizzle schemas, migrations, and health endpoint.

Phase 3: Implement URL shortening, redirects, validation, rate limiting, and tests.

Phase 4: Implement text sharing, expiration, atomic view limits, and tests.

Phase 5: Implement QR generation, previews, and export functionality.

Phase 6: Build the frontend layout and connect all features to the backend.

Phase 7: Run migrations, type checks, builds, and tests. Fix actual errors rather than suppressing them.

Phase 8: Complete the README and verify a clean local setup from the documented commands.

Do not skip ahead and generate the entire application in one enormous file. Finish and verify each phase before continuing. If a command fails, inspect its output and correct the cause.

Before making architectural changes, explain the trade-off briefly. If a requirement is ambiguous, choose a sensible MVP default and document it instead of blocking implementation with unnecessary questions.

At the end, report the implemented features, project structure, commands to run the app, tests executed, and any remaining limitations. Never claim a test passed unless it was actually executed successfully.

# 9. Recommended implementation order

I recommend the following order even if the coding agent is capable of generating the entire codebase at once:

1. Infrastructure: Bun workspace, Elysia server, Docker PostgreSQL, Drizzle migrations.
2. URL shortener: this establishes the core database and API patterns.
3. Text sharing: this tests more complicated expiration and transactional logic.
4. QR generator: comparatively isolated and easy to implement.
5. Frontend integration: connect the three tools to the real APIs.
6. Hardening: rate limiting, tests, deployment configuration, and documentation.

One architectural decision to settle early: if you eventually want users to manage links and snippets from different devices, add authentication and resource ownership before launching publicly. Until then, use local browser history for convenience and avoid exposing a global list of every user's content.
