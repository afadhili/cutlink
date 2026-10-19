# syntax=docker/dockerfile:1
FROM oven/bun:1 AS manifests
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

FROM manifests AS production-dependencies
RUN bun install --frozen-lockfile --production

FROM oven/bun:1 AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=bun:bun /app /app
COPY --chown=bun:bun packages/shared/src packages/shared/src
COPY --chown=bun:bun apps/api/src apps/api/src
COPY --chown=bun:bun docker/api-entrypoint.ts docker/api-entrypoint.ts
USER bun
EXPOSE 3000
CMD ["bun", "docker/api-entrypoint.ts", "serve"]

FROM manifests AS development-dependencies
RUN bun install --frozen-lockfile

FROM node:24-bookworm-slim AS web-build
WORKDIR /app
COPY --from=development-dependencies /app /app
COPY --from=manifests /usr/local/bin/bun /usr/local/bin/bun
COPY tsconfig.base.json ./
COPY packages/shared/src packages/shared/src
COPY apps/web apps/web
RUN bun run --cwd apps/web build

FROM nginx:1.28-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
