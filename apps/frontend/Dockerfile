# syntax=docker/dockerfile:1

# ---------- Стадия 1: сборка статики ----------
FROM node:22-slim AS build
WORKDIR /app

# Сначала зависимости — слой кэшируется, пока не меняются package*.json
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Стадия 2: раздача через nginx (без root) ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Порт 8000 — как у бэкенда
ENV PORT=8000

# Образ nginx подставляет переменные окружения в *.template при старте
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
