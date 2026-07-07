"""Deterministic rubric-based grader.

Offline fallback used when no LLM provider is configured (e.g. CI, fresh clone).
Scores by coverage of rubric points / model-answer keywords in the student
answer. Fully deterministic — no network, no API keys.
"""
from __future__ import annotations

import re
from typing import List

from ..schemas import QuestionKey
from .base import GradeOutcome, Grader

_STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "your", "you",
    "are", "was", "were", "have", "has", "had", "not", "but", "can", "could",
    "should", "would", "will", "what", "when", "where", "who", "which", "why",
    "how", "explain", "describe", "define", "list", "state", "name", "give",
    "show", "mention", "its", "their", "they", "them", "also", "such", "than",
}


def _tokens(text: str) -> List[str]:
    words = re.sub(r"[^a-z0-9\s]", " ", text.lower()).split()
    return [w for w in words if len(w) >= 3 and w not in _STOP_WORDS]


def _criteria(question: QuestionKey) -> List[str]:
    """Derive scoring criteria: explicit keywords > rubric lines > model answer."""
    if question.keywords:
        return [k.lower().strip() for k in question.keywords if k.strip()]
    if question.rubric.strip():
        lines = [ln.strip() for ln in question.rubric.splitlines() if ln.strip()]
        return [" ".join(_tokens(line)) or line.lower() for line in lines]
    # Fall back to distinct keywords from the model answer.
    return list(dict.fromkeys(_tokens(question.modelAnswer)))


class RubricGrader(Grader):
    provider = "rubric"

    def grade(self, question: QuestionKey, student_answer: str) -> GradeOutcome:
        criteria = _criteria(question)
        max_marks = float(question.maxMarks or 0)

        if not student_answer.strip():
            return GradeOutcome(0.0, "No answer detected for this question.", 0.9)
        if not criteria:
            return GradeOutcome(
                0.0,
                "No rubric, keywords, or model answer provided to grade against.",
                0.2,
            )

        answer_blob = " ".join(_tokens(student_answer))
        matched, missing = [], []
        for crit in criteria:
            crit_tokens = crit.split()
            hit = (
                any(tok in answer_blob for tok in crit_tokens)
                if crit_tokens
                else crit in student_answer.lower()
            )
            (matched if hit else missing).append(crit)

        coverage = len(matched) / len(criteria)
        awarded = round(coverage * max_marks, 2)

        parts = [f"Covered {len(matched)}/{len(criteria)} expected points."]
        if missing:
            shown = "; ".join(missing[:4])
            parts.append(
                f"Missing or unclear: {shown}{'; ...' if len(missing) > 4 else ''}."
            )
        if len(student_answer) < 120:
            parts.append("Answer is brief; check whether explanation is complete.")

        return GradeOutcome(awarded, " ".join(parts), 0.5)
