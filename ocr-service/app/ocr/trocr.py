"""TrOCR handwriting backend (line-level model + simple line segmentation).

TrOCR transcribes a single text line at a time, so we split each page into
horizontal line strips (OpenCV projection profile) before recognition. This is
heavier to wire than a VLM and less layout-aware, hence it is a fallback rather
than the default. All heavy imports are lazy.
"""
from __future__ import annotations

import logging
from typing import List

from PIL import Image

from ..config import get_settings
from .base import OcrBackend, PageOcr

logger = logging.getLogger(__name__)


def _split_lines(image: Image.Image) -> List[Image.Image]:
    """Segment a page into line images via horizontal ink projection."""
    try:
        import cv2
        import numpy as np
    except Exception:  # pragma: no cover - dependency guard
        return [image]

    gray = np.array(image.convert("L"))
    binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    row_ink = binary.sum(axis=1)
    threshold = row_ink.max() * 0.02 if row_ink.max() else 0

    lines: List[Image.Image] = []
    start = None
    for y, value in enumerate(row_ink):
        if value > threshold and start is None:
            start = y
        elif value <= threshold and start is not None:
            if y - start > 8:  # ignore specks
                lines.append(image.crop((0, max(0, start - 4), image.width, min(image.height, y + 4))))
            start = None
    if start is not None:
        lines.append(image.crop((0, max(0, start - 4), image.width, image.height)))
    return lines or [image]


class TrOCRBackend(OcrBackend):
    name = "trocr"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._pipe = None

    @classmethod
    def is_available(cls) -> bool:
        try:
            import torch  # noqa: F401
            import transformers  # noqa: F401

            return True
        except Exception:
            return False

    def _ensure_model(self):  # pragma: no cover - requires weights download
        if self._pipe is not None:
            return self._pipe
        import torch
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel

        processor = TrOCRProcessor.from_pretrained(self.settings.trocr_model_id)
        model = VisionEncoderDecoderModel.from_pretrained(self.settings.trocr_model_id)
        model.to(self.settings.resolved_device)
        if self.settings.resolved_device == "cuda":
            model.half()
        self._pipe = (processor, model, torch)
        return self._pipe

    def recognize(self, images: List[Image.Image]) -> List[PageOcr]:  # pragma: no cover
        processor, model, torch = self._ensure_model()
        results: List[PageOcr] = []
        for image in images:
            line_texts: List[str] = []
            lines = _split_lines(image)
            # Batch lines through TrOCR for speed.
            for batch_start in range(0, len(lines), 8):
                batch = [ln.convert("RGB") for ln in lines[batch_start:batch_start + 8]]
                pixel_values = processor(images=batch, return_tensors="pt").pixel_values
                pixel_values = pixel_values.to(model.device, model.dtype)
                with torch.no_grad():
                    ids = model.generate(pixel_values, max_new_tokens=128)
                line_texts.extend(processor.batch_decode(ids, skip_special_tokens=True))
            results.append(PageOcr(text="\n".join(t for t in line_texts if t.strip())))
        return results
