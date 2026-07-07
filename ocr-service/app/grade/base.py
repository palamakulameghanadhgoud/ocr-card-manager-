"""Grader interface and shared types."""
from __future__ import annotations

import abc
from dataclasses import dataclass

from ..schemas import QuestionKey


@dataclass
class GradeOutcome:
    awardedMarks: float
    feedback: str
    confidence: float


class Grader(abc.ABC):
    provider: str = "base"

    @abc.abstractmethod
    def grade(self, question: QuestionKey, student_answer: str) -> GradeOutcome:
        """Grade one student answer against one question key."""
        raise NotImplementedError
