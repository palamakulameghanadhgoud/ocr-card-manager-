"""Tesseract backend — lightweight CPU fallback so a fresh clone can OCR.

Requires the system ``tesseract`` binary at runtime; if it is missing this
backend reports itself unavailable and the factory drops to the stub.
"""
from __future__ import annotations

import logging
from typing import List

from PIL import Image

from .base import OcrBackend, PageOcr

logger = logging.getLogger(__name__)


class TesseractBackend(OcrBackend):
    name = "tesseract"

    @classmethod
    def is_available(cls) -> bool:
        try:
            import pytesseract

            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def recognize(self, images: List[Image.Image]) -> List[PageOcr]:
        import pytesseract

        results: List[PageOcr] = []
        for image in images:
            text = pytesseract.image_to_string(image)
            results.append(PageOcr(text=text.strip()))
        return results


class StubBackend(OcrBackend):
    """Last-resort backend so the service always boots and endpoints respond.

    Produces no transcription. Used only when no real OCR dependency is present
    (e.g. a fresh clone with no tesseract binary and no GPU stack). Tests inject
    a fake backend instead of relying on this.
    """

    name = "stub"

    def recognize(self, images: List[Image.Image]) -> List[PageOcr]:
        return [PageOcr(text="") for _ in images]
