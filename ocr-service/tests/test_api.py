"""API-level tests using FastAPI TestClient with a fake OCR backend (no GPU)."""
import json

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.ocr.base import OcrBackend, PageOcr


class FakeOcr(OcrBackend):
    name = "fake"

    def recognize(self, images):
        # One page transcribed with two numbered answers.
        return [
            PageOcr(
                text="1. Water boils at 100 C.\n2. Ice melts at 0 C.",
                segments=[
                    {"number": "1", "answer": "Water boils at 100 degrees celsius"},
                    {"number": "2", "answer": "Ice melts at 0 degrees celsius"},
                ],
            )
        ]


@pytest.fixture
def client(monkeypatch):
    fake = FakeOcr()
    # pipeline binds get_ocr_backend at import; patch there.
    monkeypatch.setattr("app.pipeline.get_ocr_backend", lambda: fake)
    monkeypatch.setattr("app.routers.get_ocr_backend", lambda: fake)
    return TestClient(create_app())


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["ocrBackend"] == "fake"
    assert body["graderProvider"] == "rubric"  # no keys configured


def test_evaluate_full_flow(client, png_bytes):
    answer_key = {
        "title": "Science quiz",
        "questions": [
            {"number": "1", "maxMarks": 5, "keywords": ["water", "boils", "100"]},
            {"number": "2", "maxMarks": 5, "keywords": ["ice", "melts"]},
        ],
    }
    resp = client.post(
        "/evaluate",
        files={"file": ("paper.png", png_bytes, "image/png")},
        data={"answerKey": json.dumps(answer_key)},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ocrBackend"] == "fake"
    assert len(body["perQuestion"]) == 2
    assert body["totalMax"] == 10
    assert body["totalAwarded"] == 10  # all keywords present -> full marks
    assert body["perQuestion"][0]["extractedAnswer"].startswith("Water boils")


def test_evaluate_rejects_empty_file(client):
    resp = client.post(
        "/evaluate",
        files={"file": ("empty.png", b"", "image/png")},
        data={"answerKey": "{}"},
    )
    assert resp.status_code == 400


def test_grade_endpoint_without_ocr(client):
    payload = {
        "answerKey": {"questions": [{"number": "1", "maxMarks": 2, "keywords": ["mitochondria"]}]},
        "segments": [{"number": "1", "answer": "The mitochondria produce energy"}],
    }
    resp = client.post("/grade", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["totalAwarded"] == 2
