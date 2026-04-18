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

# Install Playwright browser binaries into a known path
ENV PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers
RUN npx --yes playwright install --with-deps chromium

FROM oven/bun:1-debian AS runner

# Chromium system dependencies required by Playwright
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates tzdata \
        libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
        libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
        libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_DRIVER=sqlite
ENV DATABASE_URL=/data/local.db
ENV STATIC_ROOT=/app/web-dist
ENV SERVE_WEB=true
ENV PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers

RUN useradd -r -u 1001 -d /app -s /usr/sbin/nologin appuser \
    && mkdir -p /data \
    && chown appuser:appuser /data

COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder --chown=appuser:appuser /app/packages/api/src ./packages/api/src
COPY --from=builder --chown=appuser:appuser /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder --chown=appuser:appuser /app/packages/api/tsconfig.json ./packages/api/tsconfig.json
COPY --from=builder --chown=appuser:appuser /app/packages/shared ./packages/shared
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder --chown=appuser:appuser /app/packages/web/dist ./web-dist
COPY --from=builder --chown=appuser:appuser /app/pw-browsers /app/pw-browsers

USER appuser

EXPOSE 3000

CMD ["bun", "run", "packages/api/src/index.ts"]
