"""Provider-agnostic LLM grader.

Supports any OpenAI-compatible chat endpoint (OpenAI, a local vLLM ``/v1``
server on the A100s, or any compatible gateway) and the Anthropic Messages API.
The model is prompted to compare the student's answer against the model answer /
rubric and return strict JSON: ``{awardedMarks, feedback, confidence}``.

If a request fails or returns unparseable output, grading degrades to the
deterministic :class:`RubricGrader` for that question so a request never crashes.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

import httpx

from ..config import Settings
from ..schemas import QuestionKey
from .base import GradeOutcome, Grader
from .rubric import RubricGrader

logger = logging.getLogger(__name__)

_SYSTEM = (
    "You are a strict but fair exam grader. Compare a student's handwritten "
    "answer (already transcribed, possibly with OCR errors) against the model "
    "answer and rubric. Award partial credit for partially correct answers and "
    "be lenient about spelling/transcription noise. Respond with ONLY a JSON "
    'object: {"awardedMarks": number, "feedback": string, "confidence": number} '
    "where awardedMarks is between 0 and maxMarks and confidence is 0..1."
)


def _build_user_prompt(q: QuestionKey, student_answer: str) -> str:
    return (
        f"Question {q.number} (max {q.maxMarks} marks):\n{q.questionText or '(not provided)'}\n\n"
        f"Model answer:\n{q.modelAnswer or '(not provided)'}\n\n"
        f"Rubric / marking scheme:\n{q.rubric or '(none)'}\n\n"
        f"Student's transcribed answer:\n{student_answer or '(blank)'}\n\n"
        f"Grade it now. maxMarks = {q.maxMarks}."
    )


def _parse(raw: str, max_marks: float) -> Optional[GradeOutcome]:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return None
    try:
        obj = json.loads(match.group(0))
    except Exception:
        return None
    try:
        awarded = float(obj.get("awardedMarks", 0))
    except (TypeError, ValueError):
        return None
    awarded = max(0.0, min(awarded, max_marks))
    feedback = str(obj.get("feedback", "")).strip()
    try:
        confidence = float(obj.get("confidence", 0.7))
    except (TypeError, ValueError):
        confidence = 0.7
    return GradeOutcome(round(awarded, 2), feedback, max(0.0, min(confidence, 1.0)))


class LLMGrader(Grader):
    def __init__(self, settings: Settings, provider: str):
        self.settings = settings
        self.provider = provider  # "openai" | "local" | "anthropic"
        self._fallback = RubricGrader()

    # ------------------------------------------------------------- transport
    def _call_openai_compatible(self, user_prompt: str) -> str:
        base = (self.settings.grader_base_url or "https://api.openai.com/v1").rstrip("/")
        headers = {"Authorization": f"Bearer {self.settings.grader_api_key}"}
        payload = {
            "model": self.settings.grader_model,
            "messages": [
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.0,
            "response_format": {"type": "json_object"},
        }
        with httpx.Client(timeout=self.settings.grader_timeout_s) as client:
            resp = client.post(f"{base}/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    def _call_anthropic(self, user_prompt: str) -> str:
        headers = {
            "x-api-key": self.settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload = {
            "model": self.settings.anthropic_model,
            "max_tokens": 1024,
            "system": _SYSTEM,
            "messages": [{"role": "user", "content": user_prompt}],
        }
        with httpx.Client(timeout=self.settings.grader_timeout_s) as client:
            resp = client.post(
                "https://api.anthropic.com/v1/messages", json=payload, headers=headers
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]

    # ------------------------------------------------------------------ main
    def grade(self, question: QuestionKey, student_answer: str) -> GradeOutcome:
        prompt = _build_user_prompt(question, student_answer)
        try:
            raw = (
                self._call_anthropic(prompt)
                if self.provider == "anthropic"
                else self._call_openai_compatible(prompt)
            )
            outcome = _parse(raw, float(question.maxMarks or 0))
            if outcome is not None:
                return outcome
            logger.warning("Grader returned unparseable output; using rubric fallback.")
        except Exception as exc:
            logger.warning("LLM grading failed (%s); using rubric fallback.", exc)
        return self._fallback.grade(question, student_answer)
