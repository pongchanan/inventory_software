# ─────────────────────────────────────────────────────────────
# Stage 1 — Install dependencies
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only manifests first to leverage layer caching
COPY package.json package-lock.json* ./

RUN npm ci --ignore-scripts

# ─────────────────────────────────────────────────────────────
# Stage 2 — Build the Next.js app (standalone output)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Accept backend URL at build time (used by next.config.ts / env)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.ts already sets output: "standalone"
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 3 — Minimal production image
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone server bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets that standalone does not include
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public        ./public

USER nextjs

# Railway injects PORT; default to 3000 if not set
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["node", "server.js"]
