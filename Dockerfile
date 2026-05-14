# syntax=docker/dockerfile:1.7

FROM oven/bun:1 AS deps-prod
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build:alpic

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN chown -R node:node /app
USER node

COPY --chown=node:node --from=deps-prod /app/node_modules ./node_modules
COPY --chown=node:node --from=builder   /app/dist         ./dist
COPY --chown=node:node package.json ./

EXPOSE 3000

# Map user-facing PORT to skybridge's internal __PORT, then exec so node is PID 1.
CMD ["sh", "-c", "exec env __PORT=\"${PORT}\" node dist/server/src/index.js"]
