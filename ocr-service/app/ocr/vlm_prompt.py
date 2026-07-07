"""Shared prompt + parsing helpers for vision-language OCR backends."""
from __future__ import annotations

import json
import re
from typing import List

# Ask the VLM to transcribe handwriting AND detect question/answer structure in
# one pass. Returns strict JSON so we avoid a separate segmentation model.
STRUCTURED_OCR_PROMPT = (
    "You are an expert at reading scanned handwritten exam answer papers.\n"
    "Transcribe the handwriting on this page EXACTLY as written. Do not correct "
    "spelling, grammar, or content. Then group the text by question.\n\n"
    "Return ONLY a JSON object with this shape (no markdown, no commentary):\n"
    '{"segments": [{"number": "<question number as written, e.g. 1, 2a>", '
    '"answer": "<full transcribed answer text for that question>"}]}\n\n'
    "Rules:\n"
    "- If a question number is visible (e.g. 'Q1', '1.', '2 a)'), use just the "
    "identifier ('1', '2a').\n"
    "- If no question numbers are present, return a single segment with "
    'number "1" containing all the text.\n'
    "- Preserve line breaks inside answers with \\n.\n"
)


def parse_structured_ocr(raw: str) -> PageParse:
    """Parse a VLM response into full text + segments, tolerant of stray text."""
    segments: List[dict] = []
    text_parts: List[str] = []

    obj = _extract_json(raw)
    parsed_json = False
    if obj and isinstance(obj.get("segments"), list):
        parsed_json = True
        for seg in obj["segments"]:
            if not isinstance(seg, dict):
                continue
            number = str(seg.get("number", "")).strip()
            answer = str(seg.get("answer", "")).strip()
            if not answer:
                continue
            segments.append({"number": number or str(len(segments) + 1), "answer": answer})
            text_parts.append(f"Q{number}: {answer}" if number else answer)

    if segments:
        return PageParse(text="\n\n".join(text_parts), segments=segments)

    if parsed_json:
        return PageParse(text="", segments=[])

    # Fallback: the model returned prose instead of JSON — keep it as raw text.
    cleaned = raw.strip()
    return PageParse(text=cleaned, segments=[])


def _extract_json(raw: str):
    raw = raw.strip()
    # Strip ```json fences if present.
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw, re.DOTALL)
    candidate = fenced.group(1) if fenced else raw
    # Grab the outermost {...} if there is surrounding chatter.
    if not candidate.startswith("{"):
        brace = re.search(r"\{.*\}", candidate, re.DOTALL)
        candidate = brace.group(0) if brace else candidate
    try:
        return json.loads(candidate)
    except Exception:
        return None


class PageParse:
    __slots__ = ("text", "segments")

    def __init__(self, text: str, segments: List[dict]):
        self.text = text
        self.segments = segments
