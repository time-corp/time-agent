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

FROM node:22-bookworm-slim AS runner

# System tools (Node 22 already in base image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    ripgrep ffmpeg \
    git openssh-client \
    docker.io && \
    rm -rf /var/lib/apt/lists/*

COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# Copy node_modules trước — npx playwright dùng playwright-core từ đây
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder /app/packages/api/src ./packages/api/src
COPY --from=builder /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder /app/packages/api/tsconfig.json ./packages/api/tsconfig.json
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/packages/web/dist ./web-dist

# Dùng playwright từ node_modules local (giống hermes)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium --only-shell

# Wrapper inject container-safe flags — @mastra/agent-browser không có args option
RUN CHROMIUM="$(find /ms-playwright -type f \( -name 'chrome-headless-shell' -o -name 'chrome' \) | sort | head -1)" && \
    test -n "$CHROMIUM" && \
    printf '%s\n' \
      '#!/bin/sh' \
      'set -eu' \
      'mkdir -p /tmp/chrome-profile /tmp/chrome-crashes' \
      "exec \"$CHROMIUM\" \\" \
      '  --no-sandbox \' \
      '  --disable-dev-shm-usage \' \
      '  --disable-gpu \' \
      '  --crash-dumps-dir=/tmp/chrome-crashes \' \
      '  --user-data-dir=/tmp/chrome-profile \' \
      '  "$@"' \
    > /usr/local/bin/chromium-wrapper && \
    chmod +x /usr/local/bin/chromium-wrapper

RUN useradd -r -u 1001 -d /app -s /usr/sbin/nologin appuser \
    && mkdir -p /data /app/.artifacts \
    && chown -R appuser:appuser /app /data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_DRIVER=sqlite
ENV DATABASE_URL=/data/local.db
ENV STATIC_ROOT=/app/web-dist
ENV SERVE_WEB=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/local/bin/chromium-wrapper

USER appuser

EXPOSE 3000

CMD ["bun", "run", "packages/api/src/index.ts"]
