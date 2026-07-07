"""Document preprocessing: bytes (PDF or image) -> list of page images.

Optional deskew/denoise via OpenCV. Every heavy/optional dependency is imported
lazily and guarded so the module works even when only Pillow is installed.
"""
from __future__ import annotations

import io
import logging
from typing import List

from PIL import Image

logger = logging.getLogger(__name__)

PDF_MAGIC = b"%PDF"


def _load_pdf_pages(data: bytes, dpi: int, max_pages: int) -> List[Image.Image]:
    try:
        import fitz  # PyMuPDF
    except Exception as exc:  # pragma: no cover - dependency guard
        raise RuntimeError(
            "PDF support requires PyMuPDF (`pip install PyMuPDF`)."
        ) from exc

    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    pages: List[Image.Image] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            if len(pages) >= max_pages:
                logger.warning("PDF exceeds max_pages=%s; truncating.", max_pages)
                break
            pix = page.get_pixmap(matrix=matrix)
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            pages.append(img)
    return pages


def _deskew(image: Image.Image) -> Image.Image:
    """Best-effort deskew using OpenCV. Returns the input unchanged on any error."""
    try:
        import cv2
        import numpy as np
    except Exception:  # pragma: no cover - dependency guard
        return image

    try:
        arr = np.array(image.convert("L"))
        inverted = cv2.bitwise_not(arr)
        thresh = cv2.threshold(
            inverted, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )[1]
        coords = np.column_stack(np.where(thresh > 0))
        if coords.shape[0] < 50:
            return image
        angle = cv2.minAreaRect(coords)[-1]
        angle = -(90 + angle) if angle < -45 else -angle
        if abs(angle) < 0.5:  # not worth rotating
            return image
        (h, w) = arr.shape
        matrix = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
        rgb = np.array(image.convert("RGB"))
        rotated = cv2.warpAffine(
            rgb, matrix, (w, h),
            flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE,
        )
        return Image.fromarray(rotated)
    except Exception:  # pragma: no cover - be resilient to odd inputs
        logger.debug("Deskew failed; using original image.", exc_info=True)
        return image


def load_pages(
    data: bytes,
    content_type: str = "",
    filename: str = "",
    *,
    dpi: int = 200,
    max_pages: int = 30,
    deskew: bool = True,
) -> List[Image.Image]:
    """Turn uploaded bytes into a list of RGB page images, preprocessed."""
    is_pdf = (
        data[:4] == PDF_MAGIC
        or "pdf" in (content_type or "").lower()
        or filename.lower().endswith(".pdf")
    )

    if is_pdf:
        pages = _load_pdf_pages(data, dpi=dpi, max_pages=max_pages)
    else:
        pages = [Image.open(io.BytesIO(data)).convert("RGB")]

    if deskew:
        pages = [_deskew(p) for p in pages]
    return pages
