from sys import prefix

from fastapi import APIRouter

from app.api import health, recipes

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(recipes.router, prefix="/recipes")
