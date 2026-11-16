.PHONY: dev up down logs test lint

dev:        ## запустить бэкенд в docker (с автоперезагрузкой)
	docker compose up --build

up:         ## запустить в фоне
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f api

test:       ## тесты (локально, нужен uv)
	cd apps/api && uv run pytest

lint:
	cd apps/api && uv run ruff check . && uv run ruff format --check .
