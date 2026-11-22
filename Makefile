.PHONY: dev up down logs test lint

## запустить бэкенд в docker (с автоперезагрузкой)
dev:
	docker compose up --build

## запустить в фоне
up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f api

## тесты (нужен uv и Postgres из compose)
test:
	docker compose up -d --wait db
	cd apps/api && uv run pytest

lint:
	cd apps/api && uv run ruff check . && uv run ruff format --check .
