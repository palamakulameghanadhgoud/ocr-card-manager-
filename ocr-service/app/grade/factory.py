"""Grader factory with provider auto-resolution.

``GRADER_PROVIDER=auto`` (default) resolves to the first configured option:
  anthropic (ANTHROPIC_API_KEY) -> openai/local (GRADER_API_KEY or GRADER_BASE_URL)
  -> deterministic rubric.
Explicit providers are honored but degrade to rubric when not configured.
"""
from __future__ import annotations

import logging
from functools import lru_cache

from ..config import get_settings
from .base import Grader
from .llm import LLMGrader
from .rubric import RubricGrader

logger = logging.getLogger(__name__)


def _resolve_provider() -> str:
    settings = get_settings()
    requested = settings.grader_provider.lower()

    def has_openai() -> bool:
        return bool(settings.grader_api_key or settings.grader_base_url)

    if requested == "anthropic":
        return "anthropic" if settings.anthropic_api_key else "rubric"
    if requested in ("openai", "local"):
        return requested if has_openai() else "rubric"
    if requested == "rubric":
        return "rubric"

    # auto
    if settings.anthropic_api_key:
        return "anthropic"
    if has_openai():
        return "openai"
    return "rubric"


@lru_cache
def get_grader() -> Grader:
    provider = _resolve_provider()
    if provider == "rubric":
        logger.info("Grader active: rubric (deterministic fallback)")
        return RubricGrader()
    grader = LLMGrader(get_settings(), provider)
    logger.info("Grader active: %s", provider)
    return grader


def reset_grader() -> None:
    """Clear the cached grader (used by tests)."""
    get_grader.cache_clear()
