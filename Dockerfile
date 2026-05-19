# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# ---- deps ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Variáveis dummy só pra build resolver o env.ts (substituídas em runtime)
ENV DATABASE_URL=postgres://x:x@localhost/x
ENV AUTH_SECRET=build-time-placeholder-secret-not-used
ENV RESEND_API_KEY=build-time-placeholder
ENV EMAIL_FROM=build@example.com
ENV ALLOWED_EMAILS=build@example.com
RUN pnpm build

# ---- runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrator isolado: ESM não respeita NODE_PATH, então mantemos migrate.mjs
# junto com seu node_modules em /app/migrator.
RUN mkdir -p /app/migrator && \
    echo '{"type":"module","dependencies":{"drizzle-orm":"^0.45","postgres":"^3.4"}}' \
      > /app/migrator/package.json && \
    cd /app/migrator && \
    npm install --omit=dev --no-package-lock --silent
COPY --from=builder /app/src/db/migrate.mjs /app/migrator/migrate.mjs
COPY --from=builder /app/drizzle /app/migrator/drizzle
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown nextjs:nodejs ./entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./entrypoint.sh"]
