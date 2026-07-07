"""FastAPI application factory."""
from __future__ import annotations

import logging

from fastapi import FastAPI

from .config import get_settings
from .routers import router


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        description="OCR + LLM grading service for handwritten answer papers.",
    )
    app.include_router(router)
    return app


app = create_app()
