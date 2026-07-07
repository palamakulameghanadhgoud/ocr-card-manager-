"""Pydantic request/response schemas shared across the service."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------- inputs
class QuestionKey(BaseModel):
    number: str = Field(..., description="Question identifier, e.g. '1' or '2a'.")
    questionText: str = ""
    modelAnswer: str = ""
    maxMarks: float = 1.0
    rubric: str = ""
    keywords: List[str] = []


class AnswerKey(BaseModel):
    title: str = ""
    questions: List[QuestionKey] = []


# -------------------------------------------------------------------- outputs
class QaSegment(BaseModel):
    """A question/answer pair extracted from the paper."""

    number: str
    answer: str


class OcrResult(BaseModel):
    backend: str
    pages: int
    text: str
    segments: List[QaSegment] = []


class GradedQuestion(BaseModel):
    number: str
    questionText: str = ""
    extractedAnswer: str = ""
    awardedMarks: float = 0.0
    maxMarks: float = 0.0
    feedback: str = ""
    confidence: float = 0.0


class EvaluationResult(BaseModel):
    ocrBackend: str
    graderProvider: str
    pages: int
    extractedText: str
    perQuestion: List[GradedQuestion]
    totalAwarded: float
    totalMax: float


class HealthResult(BaseModel):
    status: str
    ocrBackend: str
    ocrAvailable: bool
    graderProvider: str
    device: str
    gpu: bool
