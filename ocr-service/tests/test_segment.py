"""Tests for question/answer segmentation heuristics + structured merge."""
from app.ocr.base import PageOcr
from app.segment import build_segments, segment_text


def test_segment_numbered_questions():
    text = (
        "1. Photosynthesis converts light into energy.\n"
        "It happens in chloroplasts.\n"
        "2) Mitochondria are the powerhouse of the cell.\n"
        "Q3: Osmosis is water movement across a membrane."
    )
    segs = segment_text(text)
    numbers = [s.number for s in segs]
    assert numbers == ["1", "2", "3"]
    assert "chloroplasts" in segs[0].answer
    assert "powerhouse" in segs[1].answer


def test_segment_no_numbers_single_block():
    segs = segment_text("Just one continuous answer with no markers.")
    assert len(segs) == 1
    assert segs[0].number == "1"


def test_build_segments_prefers_structured():
    pages = [PageOcr(text="ignored", segments=[{"number": "2a", "answer": "structured answer"}])]
    segs = build_segments(pages)
    assert len(segs) == 1
    assert segs[0].number == "2a"
    assert segs[0].answer == "structured answer"


def test_build_segments_merges_same_number_across_pages():
    pages = [
        PageOcr(segments=[{"number": "1", "answer": "part one"}]),
        PageOcr(segments=[{"number": "1", "answer": "part two"}]),
    ]
    segs = build_segments(pages)
    assert len(segs) == 1
    assert "part one" in segs[0].answer and "part two" in segs[0].answer


def test_build_segments_falls_back_to_text():
    pages = [PageOcr(text="1. alpha\n2. beta")]
    segs = build_segments(pages)
    assert [s.number for s in segs] == ["1", "2"]
