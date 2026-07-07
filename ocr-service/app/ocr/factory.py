"""OCR backend factory with availability-based auto-selection.

When ``OCR_BACKEND=auto`` (default) the first backend in ``ocr_preference`` whose
dependencies are available is chosen, so the service always starts — using
Qwen2.5-VL when the GPU stack is present and quietly degrading to Tesseract/stub
otherwise. An explicit ``OCR_BACKEND`` is honored but still degrades (with a
warning) if that backend is unavailable.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Dict, Type

from ..config import get_settings
from .base import OcrBackend
from .paddle import PaddleOCRBackend
from .qwen_vl import Qwen2VLBackend
from .simple_htr import SimpleHTRBackend
from .tesseract import StubBackend, TesseractBackend
from .trocr import TrOCRBackend

logger = logging.getLogger(__name__)

REGISTRY: Dict[str, Type[OcrBackend]] = {
    Qwen2VLBackend.name: Qwen2VLBackend,
    TrOCRBackend.name: TrOCRBackend,
    PaddleOCRBackend.name: PaddleOCRBackend,
    TesseractBackend.name: TesseractBackend,
    SimpleHTRBackend.name: SimpleHTRBackend,
    StubBackend.name: StubBackend,
}


def _select_backend_class() -> Type[OcrBackend]:
    settings = get_settings()
    requested = settings.ocr_backend.lower()

    if requested != "auto":
        cls = REGISTRY.get(requested)
        if cls is None:
            logger.warning("Unknown OCR_BACKEND=%s; falling back to auto.", requested)
        elif cls.is_available():
            return cls
        else:
            logger.warning(
                "Requested OCR backend '%s' is unavailable; auto-selecting.", requested
            )

    for name in settings.ocr_preference:
        cls = REGISTRY.get(name)
        if cls and cls.is_available():
            if name != settings.ocr_preference[0]:
                logger.info("OCR auto-selected fallback backend: %s", name)
            return cls

    return StubBackend


@lru_cache
def get_ocr_backend() -> OcrBackend:
    cls = _select_backend_class()
    backend = cls()
    logger.info("OCR backend active: %s", backend.name)
    return backend


def reset_ocr_backend() -> None:
    """Clear the cached backend (used by tests)."""
    get_ocr_backend.cache_clear()
