"""Tests for the LLM grader transport + parsing (mocked HTTP, no real API)."""
import httpx
import respx

from app.config import Settings
from app.grade.llm import LLMGrader, _parse
from app.schemas import QuestionKey


def test_parse_valid_json_clamped():
    outcome = _parse('{"awardedMarks": 12, "feedback": "good", "confidence": 0.8}', max_marks=10)
    assert outcome.awardedMarks == 10  # clamped to max
    assert outcome.feedback == "good"


def test_parse_handles_surrounding_text():
    outcome = _parse('Here you go: {"awardedMarks": 3, "feedback": "ok"} done', max_marks=5)
    assert outcome.awardedMarks == 3


def test_parse_returns_none_on_garbage():
    assert _parse("not json at all", max_marks=5) is None


@respx.mock
def test_openai_compatible_grade():
    respx.post("https://api.openai.com/v1/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "choices": [
                    {"message": {"content": '{"awardedMarks": 4, "feedback": "solid", "confidence": 0.9}'}}
                ]
            },
        )
    )
    settings = Settings(grader_api_key="sk-test", grader_model="gpt-4o-mini")
    grader = LLMGrader(settings, provider="openai")
    outcome = grader.grade(QuestionKey(number="1", maxMarks=5), "an answer")
    assert outcome.awardedMarks == 4
    assert outcome.feedback == "solid"


@respx.mock
def test_grade_falls_back_to_rubric_on_http_error():
    respx.post("https://api.openai.com/v1/chat/completions").mock(
        return_value=httpx.Response(500)
    )
    settings = Settings(grader_api_key="sk-test")
    grader = LLMGrader(settings, provider="openai")
    q = QuestionKey(number="1", maxMarks=4, keywords=["alpha", "beta"])
    outcome = grader.grade(q, "alpha and beta present")
    # Rubric fallback still produces a deterministic score.
    assert outcome.awardedMarks == 4
