# syntax=docker/dockerfile:1.9

# ─── Base ─────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ─── Deps (cache-friendly) ────────────────────────────────────────
FROM base AS deps
COPY src/frontend/package.json src/frontend/pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile || pnpm install

# ─── Dev target ───────────────────────────────────────────────────
FROM deps AS dev
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["pnpm", "dev"]

# ─── Build ────────────────────────────────────────────────────────
FROM deps AS build
COPY src/frontend ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ─── Prod runtime ─────────────────────────────────────────────────
FROM node:20-alpine AS prod
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider -q http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
