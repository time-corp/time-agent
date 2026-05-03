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

FROM debian:bookworm-slim AS runner

# Node 22 + all system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends \
    nodejs \
    python3 python3-pip \
    ripgrep ffmpeg \
    git openssh-client \
    docker.io && \
    rm -rf /var/lib/apt/lists/*

# Bun runtime
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# Install Playwright Chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright@1.59.1 install --with-deps chromium

# Debug: show what was installed (remove after confirming path)
RUN find /ms-playwright -type f -name 'chrom*' | sort

# Wrapper to inject container-safe Chromium flags
RUN CHROMIUM="$(find /ms-playwright -type f \( -name 'chrome-headless-shell' -o -name 'chrome' -o -name 'chromium' \) | sort | head -1)" && \
    test -n "$CHROMIUM" && \
    printf '%s\n' \
      '#!/bin/sh' \
      'set -eu' \
      '' \
      'mkdir -p /tmp/chrome-profile /tmp/chrome-crashes' \
      '' \
      "exec \"$CHROMIUM\" \\" \
      '  --no-sandbox \' \
      '  --disable-dev-shm-usage \' \
      '  --disable-gpu \' \
      '  --crash-dumps-dir=/tmp/chrome-crashes \' \
      '  --user-data-dir=/tmp/chrome-profile \' \
      '  "$@"' \
    > /usr/local/bin/chromium-wrapper && \
    chmod +x /usr/local/bin/chromium-wrapper

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_DRIVER=sqlite
ENV DATABASE_URL=/data/local.db
ENV STATIC_ROOT=/app/web-dist
ENV SERVE_WEB=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/local/bin/chromium-wrapper

RUN useradd -r -u 1001 -d /app -s /usr/sbin/nologin appuser \
    && mkdir -p /data /app/.artifacts \
    && chown appuser:appuser /data /app/.artifacts

COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder --chown=appuser:appuser /app/packages/api/src ./packages/api/src
COPY --from=builder --chown=appuser:appuser /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder --chown=appuser:appuser /app/packages/api/tsconfig.json ./packages/api/tsconfig.json
COPY --from=builder --chown=appuser:appuser /app/packages/shared ./packages/shared
COPY --from=builder --chown=appuser:appuser /app/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder --chown=appuser:appuser /app/packages/web/dist ./web-dist

USER appuser

EXPOSE 3000

CMD ["bun", "run", "packages/api/src/index.ts"]
