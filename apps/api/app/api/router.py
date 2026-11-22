from sys import prefix

from fastapi import APIRouter

from app.api import auth, health, recipes

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(recipes.router, prefix="/recipes")
