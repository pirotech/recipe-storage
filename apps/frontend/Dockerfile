# syntax=docker/dockerfile:1

# ---------- Стадия 1: сборка статики ----------
FROM node:22-slim AS build
WORKDIR /app

# Сначала зависимости — слой кэшируется, пока не меняются package*.json
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite вшивает VITE_* в бандл на этапе сборки, поэтому адрес API — build-аргумент.
# Для сервера: docker build --build-arg VITE_API_URL=https://api.example.com/api .
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Стадия 2: раздача через nginx (без root) ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
