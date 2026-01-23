FROM oven/bun:1.3.6-slim

WORKDIR /app

COPY package.json .
COPY bun.lock .
COPY turbo.json .

COPY apps/bot/package.json ./apps/bot/
COPY apps/schedule-updater/package.json ./apps/schedule-updater/
COPY apps/web/package.json ./apps/web/
COPY packages/bitrix/package.json ./packages/bitrix/
COPY packages/drizzle/package.json ./packages/drizzle/
COPY packages/env/package.json ./packages/env/
COPY packages/orpc/package.json ./packages/orpc/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN bun install --frozen-lockfile

COPY . .

WORKDIR /app/apps/bot

ENTRYPOINT ["bun", "run", "start"]