FROM oven/bun:1.3.3-alpine

WORKDIR /app

# Копируем файлы прокси-приложения
COPY apps/proxy/package.json apps/proxy/
COPY apps/proxy/index.ts apps/proxy/

# Устанавливаем зависимости
WORKDIR /app/apps/proxy
RUN bun install --frozen-lockfile

# Переменные окружения по умолчанию
ENV PROXY_TARGET=https://portal.midis.info
ENV PORT=3000

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["bun", "run", "index.ts"]
