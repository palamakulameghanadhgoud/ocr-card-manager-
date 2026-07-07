"""PaddleOCR backend — strong general document OCR, printed-text oriented.

Fallback option; weaker on cursive handwriting than the VLM/TrOCR paths.
"""
from __future__ import annotations

import logging
from typing import List

import numpy as np
from PIL import Image

from .base import OcrBackend, PageOcr

logger = logging.getLogger(__name__)


class PaddleOCRBackend(OcrBackend):
    name = "paddle"

    def __init__(self) -> None:
        self._ocr = None

    @classmethod
    def is_available(cls) -> bool:
        try:
            import paddleocr  # noqa: F401

            return True
        except Exception:
            return False

    def _ensure(self):  # pragma: no cover - requires paddle install
        if self._ocr is None:
            from paddleocr import PaddleOCR

            self._ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        return self._ocr

    def recognize(self, images: List[Image.Image]) -> List[PageOcr]:  # pragma: no cover
        ocr = self._ensure()
        results: List[PageOcr] = []
        for image in images:
            arr = np.array(image.convert("RGB"))
            raw = ocr.ocr(arr, cls=True)
            lines: List[str] = []
            for block in raw or []:
                for entry in block or []:
                    text = entry[1][0] if entry and entry[1] else ""
                    if text:
                        lines.append(text)
            results.append(PageOcr(text="\n".join(lines)))
        return results
