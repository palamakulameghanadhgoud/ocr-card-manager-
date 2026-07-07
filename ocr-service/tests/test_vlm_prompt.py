"""Tests for VLM prompt parsing."""
import pytest
from app.ocr.vlm_prompt import parse_structured_ocr, PageParse


def test_parse_valid_json():
    raw = '{"segments": [{"number": "1", "answer": "Answer one"}, {"number": "2", "answer": "Answer two"}]}'
    result = parse_structured_ocr(raw)
    assert isinstance(result, PageParse)
    assert len(result.segments) == 2
    assert result.segments[0]["number"] == "1"
    assert result.segments[0]["answer"] == "Answer one"
    assert result.segments[1]["number"] == "2"
    assert "Answer" in result.text


def test_parse_json_with_markdown_fences():
    raw = '```json\n{"segments": [{"number": "1", "answer": "Test"}]}\n```'
    result = parse_structured_ocr(raw)
    assert len(result.segments) == 1
    assert result.segments[0]["answer"] == "Test"


def test_parse_json_with_extra_text():
    raw = 'Here is the result: {"segments": [{"number": "1", "answer": "Found it"}]} End.'
    result = parse_structured_ocr(raw)
    assert len(result.segments) == 1
    assert result.segments[0]["answer"] == "Found it"


def test_parse_empty_segments():
    raw = '{"segments": []}'
    result = parse_structured_ocr(raw)
    assert result.segments == []
    assert result.text == ""


def test_parse_malformed_json_fallback():
    raw = 'Not valid JSON at all, just plain text response.'
    result = parse_structured_ocr(raw)
    assert result.segments == []
    assert result.text == raw.strip()


def test_parse_segment_without_number():
    raw = '{"segments": [{"answer": "No number here"}]}'
    result = parse_structured_ocr(raw)
    assert len(result.segments) == 1
    assert result.segments[0]["number"] == "1"
    assert result.segments[0]["answer"] == "No number here"


def test_parse_skips_empty_answers():
    raw = '{"segments": [{"number": "1", "answer": "Valid"}, {"number": "2", "answer": ""}, {"number": "3", "answer": "Also valid"}]}'
    result = parse_structured_ocr(raw)
    assert len(result.segments) == 2
    assert result.segments[0]["number"] == "1"
    assert result.segments[1]["number"] == "3"