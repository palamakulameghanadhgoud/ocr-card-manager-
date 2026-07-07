"""FastAPI routers: /health, /ocr, /grade, /evaluate."""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from .config import get_settings
from .grade.factory import get_grader
from .ocr.factory import get_ocr_backend
from .pipeline import evaluate, grade_segments, run_ocr
from .schemas import (
    AnswerKey,
    EvaluationResult,
    HealthResult,
    OcrResult,
    QaSegment,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _parse_answer_key(raw: str) -> AnswerKey:
    if not raw or not raw.strip():
        return AnswerKey()
    try:
        return AnswerKey.model_validate_json(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid answerKey JSON: {exc}")


@router.get("/health", response_model=HealthResult)
def health() -> HealthResult:
    settings = get_settings()
    backend = get_ocr_backend()
    device = settings.resolved_device
    return HealthResult(
        status="ok",
        ocrBackend=backend.name,
        ocrAvailable=backend.name != "stub",
        graderProvider=get_grader().provider,
        device=device,
        gpu=device == "cuda",
    )


@router.post("/ocr", response_model=OcrResult)
async def ocr_endpoint(file: UploadFile = File(...)) -> OcrResult:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    return run_ocr(data, content_type=file.content_type or "", filename=file.filename or "")


@router.post("/grade")
def grade_endpoint(payload: dict) -> dict:
    """Grade already-extracted segments against an answer key (no OCR)."""
    answer_key = AnswerKey.model_validate(payload.get("answerKey", {}))
    segments = [QaSegment.model_validate(s) for s in payload.get("segments", [])]
    graded = grade_segments(segments, answer_key)
    return {
        "graderProvider": get_grader().provider,
        "perQuestion": [g.model_dump() for g in graded],
        "totalAwarded": round(sum(g.awardedMarks for g in graded), 2),
        "totalMax": round(sum(g.maxMarks for g in graded), 2),
    }


@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_endpoint(
    file: UploadFile = File(...),
    answerKey: str = Form("{}"),
) -> EvaluationResult:
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    key = _parse_answer_key(answerKey)
    return evaluate(
        data, key, content_type=file.content_type or "", filename=file.filename or ""
    )
