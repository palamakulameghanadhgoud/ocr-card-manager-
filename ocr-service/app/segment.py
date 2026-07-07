"""Question/answer segmentation.

VLM backends (Qwen2.5-VL) return question/answer segments directly. For
plain-text backends (TrOCR/Paddle/Tesseract) this module splits the transcript
into (number, answer) pairs using question-number heuristics.
"""
from __future__ import annotations

import re
from typing import List

from .ocr.base import PageOcr
from .schemas import QaSegment

# Matches leading question markers like: "1.", "1)", "Q1", "Q 1:", "2 a)", "(3)"
_Q_PATTERN = re.compile(
    r"^\s*(?:Q(?:uestion)?[\s.:-]*)?\(?(\d{1,3}[a-dA-D]?)\)?[.):\-]\s+",
    re.IGNORECASE,
)


def _normalize_number(raw: str) -> str:
    return raw.strip().lower().replace(" ", "")


def segment_text(text: str) -> List[QaSegment]:
    """Split a transcript into Q/A pairs by detecting question numbers."""
    lines = [ln.rstrip() for ln in text.splitlines()]
    segments: List[QaSegment] = []
    current_number: str | None = None
    buffer: List[str] = []

    def flush():
        if current_number is not None:
            answer = "\n".join(buffer).strip()
            if answer:
                segments.append(QaSegment(number=current_number, answer=answer))

    for line in lines:
        match = _Q_PATTERN.match(line)
        if match:
            flush()
            current_number = _normalize_number(match.group(1))
            buffer = [line[match.end():].strip()]
        elif current_number is not None:
            buffer.append(line)
        elif line.strip():
            # Text before any question marker -> treat as question "1".
            current_number = "1"
            buffer = [line.strip()]
    flush()

    if not segments and text.strip():
        segments.append(QaSegment(number="1", answer=text.strip()))
    return segments


def build_segments(pages: List[PageOcr]) -> List[QaSegment]:
    """Combine per-page OCR into a single ordered list of Q/A segments.

    Uses backend-provided structure when available; otherwise falls back to
    text heuristics. Segments sharing a question number are merged in order.
    """
    structured: List[QaSegment] = []
    for page in pages:
        for seg in page.segments:
            number = _normalize_number(str(seg.get("number", "")))
            answer = str(seg.get("answer", "")).strip()
            if answer:
                structured.append(QaSegment(number=number or str(len(structured) + 1), answer=answer))

    if not structured:
        combined = "\n".join(p.text for p in pages if p.text.strip())
        structured = segment_text(combined)

    return _merge_by_number(structured)


def _merge_by_number(segments: List[QaSegment]) -> List[QaSegment]:
    order: List[str] = []
    merged: dict[str, List[str]] = {}
    for seg in segments:
        if seg.number not in merged:
            merged[seg.number] = []
            order.append(seg.number)
        merged[seg.number].append(seg.answer)
    return [QaSegment(number=n, answer="\n".join(merged[n]).strip()) for n in order]
