"""OCR backend interface and shared types."""
from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import List

from PIL import Image


@dataclass
class PageOcr:
    """OCR output for a single page.

    `text` is the plain transcription. `segments` is an optional list of
    (number, answer) pairs when the backend is layout-aware enough to detect
    question/answer structure directly (e.g. Qwen2.5-VL). When empty, the
    downstream segmenter derives pairs from `text`.
    """

    text: str = ""
    segments: List[dict] = field(default_factory=list)


class OcrBackend(abc.ABC):
    name: str = "base"

    @classmethod
    def is_available(cls) -> bool:
        """Whether this backend's dependencies/resources are usable right now."""
        return True

    @abc.abstractmethod
    def recognize(self, images: List[Image.Image]) -> List[PageOcr]:
        """Transcribe each page image."""
        raise NotImplementedError
