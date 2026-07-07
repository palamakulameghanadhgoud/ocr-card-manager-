"""Tests for the deterministic rubric grader."""
from app.grade.rubric import RubricGrader
from app.schemas import QuestionKey


def test_full_marks_when_all_keywords_present():
    q = QuestionKey(number="1", maxMarks=10, keywords=["photosynthesis", "chloroplast", "light"])
    outcome = RubricGrader().grade(q, "Photosynthesis occurs in the chloroplast using light energy.")
    assert outcome.awardedMarks == 10


def test_partial_marks():
    q = QuestionKey(number="1", maxMarks=10, keywords=["alpha", "beta", "gamma", "delta"])
    outcome = RubricGrader().grade(q, "Only alpha and beta are mentioned here.")
    assert outcome.awardedMarks == 5.0
    assert "Missing" in outcome.feedback


def test_blank_answer_scores_zero():
    q = QuestionKey(number="1", maxMarks=5, keywords=["anything"])
    outcome = RubricGrader().grade(q, "   ")
    assert outcome.awardedMarks == 0
    assert "No answer" in outcome.feedback


def test_model_answer_used_when_no_keywords():
    q = QuestionKey(number="1", maxMarks=4, modelAnswer="Osmosis is the diffusion of water molecules")
    outcome = RubricGrader().grade(q, "Osmosis is the diffusion of water across a membrane.")
    assert outcome.awardedMarks > 0


def test_rubric_lines_used_when_provided():
    q = QuestionKey(
        number="1", maxMarks=2,
        rubric="Defines the term correctly\nGives a relevant example",
    )
    outcome = RubricGrader().grade(q, "It defines the term correctly and gives a relevant example.")
    assert outcome.awardedMarks == 2
