# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/web/package.json packages/web/package.json

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable

COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
COPY --from=deps /app /app
COPY packages ./packages

RUN pnpm --filter @time/web build
RUN pnpm --filter @time/api build

FROM debian:bookworm-slim AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_DRIVER=sqlite
ENV DATABASE_URL=/data/local.db
ENV STATIC_ROOT=/app/web-dist
ENV SERVE_WEB=true

RUN useradd -r -u 1001 -d /app -s /usr/sbin/nologin appuser \
    && mkdir -p /data \
    && chown appuser:appuser /data

COPY --from=builder --chown=appuser:appuser /app/packages/api/dist/api ./api
COPY --from=builder --chown=appuser:appuser /app/packages/web/dist ./web-dist

USER appuser

EXPOSE 3000

CMD ["./api"]