"""Shared pytest fixtures."""
import io

import pytest
from PIL import Image


@pytest.fixture
def png_bytes() -> bytes:
    img = Image.new("RGB", (200, 80), "white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


_ENV_VARS = [
    "OCR_BACKEND", "VLLM_BASE_URL", "VLLM_API_KEY",
    "GRADER_PROVIDER", "GRADER_BASE_URL", "GRADER_API_KEY", "GRADER_MODEL",
    "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL",
]


@pytest.fixture(autouse=True)
def _reset_singletons(monkeypatch):
    """Reset cached singletons and isolate tests from the host environment."""
    from app.config import get_settings
    from app.grade.factory import reset_grader
    from app.ocr.factory import reset_ocr_backend

    # Hermetic: ignore any grader/OCR env the developer's shell happens to set.
    for var in _ENV_VARS:
        monkeypatch.delenv(var, raising=False)

    get_settings.cache_clear()
    reset_ocr_backend()
    reset_grader()
    yield
    get_settings.cache_clear()
    reset_ocr_backend()
    reset_grader()
