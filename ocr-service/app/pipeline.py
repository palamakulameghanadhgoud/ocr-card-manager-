"""End-to-end pipeline: bytes -> OCR -> segments -> graded result."""
from __future__ import annotations

import logging
from typing import List

from . import preprocess
from .config import get_settings
from .grade.factory import get_grader
from .ocr.factory import get_ocr_backend
from .schemas import (
    AnswerKey,
    EvaluationResult,
    GradedQuestion,
    OcrResult,
    QaSegment,
    QuestionKey,
)
from .segment import build_segments

logger = logging.getLogger(__name__)


def run_ocr(data: bytes, content_type: str = "", filename: str = "") -> OcrResult:
    settings = get_settings()
    backend = get_ocr_backend()
    pages = preprocess.load_pages(
        data,
        content_type=content_type,
        filename=filename,
        dpi=settings.pdf_render_dpi,
        max_pages=settings.max_pages,
        deskew=settings.deskew,
    )
    page_results = backend.recognize(pages)
    segments = build_segments(page_results)
    full_text = "\n\n".join(p.text for p in page_results if p.text.strip())
    return OcrResult(
        backend=backend.name,
        pages=len(pages),
        text=full_text,
        segments=segments,
    )


def grade_segments(segments: List[QaSegment], answer_key: AnswerKey) -> List[GradedQuestion]:
    grader = get_grader()
    answers = {seg.number: seg.answer for seg in segments}
    graded: List[GradedQuestion] = []

    keys = answer_key.questions or _keys_from_segments(segments)
    for key in keys:
        student_answer = answers.get(key.number, "")
        outcome = grader.grade(key, student_answer)
        graded.append(
            GradedQuestion(
                number=key.number,
                questionText=key.questionText,
                extractedAnswer=student_answer,
                awardedMarks=outcome.awardedMarks,
                maxMarks=float(key.maxMarks or 0),
                feedback=outcome.feedback,
                confidence=outcome.confidence,
            )
        )
    return graded


def _keys_from_segments(segments: List[QaSegment]) -> List[QuestionKey]:
    """When no answer key is supplied, still return extracted answers (0 marks)."""
    return [QuestionKey(number=s.number, maxMarks=0) for s in segments]


def evaluate(
    data: bytes, answer_key: AnswerKey, content_type: str = "", filename: str = ""
) -> EvaluationResult:
    ocr = run_ocr(data, content_type=content_type, filename=filename)
    graded = grade_segments(ocr.segments, answer_key)
    return EvaluationResult(
        ocrBackend=ocr.backend,
        graderProvider=get_grader().provider,
        pages=ocr.pages,
        extractedText=ocr.text,
        perQuestion=graded,
        totalAwarded=round(sum(g.awardedMarks for g in graded), 2),
        totalMax=round(sum(g.maxMarks for g in graded), 2),
    )
