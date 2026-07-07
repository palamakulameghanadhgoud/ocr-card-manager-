"""Application configuration, loaded from environment variables / .env.

All settings have safe defaults so the service boots on a fresh clone with no
GPU and no API keys (falling back to Tesseract/stub OCR and the deterministic
rubric grader).
"""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # ------------------------------------------------------------------ app
    app_name: str = "answer-paper-ocr-service"
    log_level: str = "INFO"

    # ------------------------------------------------------------------ OCR
    # "auto" picks the first available backend from ocr_preference.
    # Explicit values: qwen2vl | trocr | paddle | tesseract | stub
    ocr_backend: str = "auto"
    ocr_preference: List[str] = ["simplehtr", "qwen2vl", "trocr", "paddle", "tesseract", "stub"]

    # Qwen2.5-VL served via a vLLM OpenAI-compatible endpoint (recommended).
    # When unset, the qwen backend falls back to local transformers if installed.
    vllm_base_url: str = ""          # e.g. http://localhost:8000/v1
    vllm_api_key: str = "EMPTY"      # vLLM ignores the value but the client needs one
    qwen_model_id: str = "Qwen/Qwen2.5-VL-7B-Instruct"

    trocr_model_id: str = "microsoft/trocr-large-handwritten"
    device: str = "auto"             # auto | cuda | cpu

    # ------------------------------------------------------------ preprocess
    pdf_render_dpi: int = 200
    max_pages: int = 30
    deskew: bool = True

    # -------------------------------------------------------------- grading
    # "auto" resolves to anthropic -> openai/local -> rubric based on what is
    # configured. Explicit: anthropic | openai | local | rubric
    grader_provider: str = "auto"
    grader_base_url: str = ""        # OpenAI-compatible base URL (or local vLLM /v1)
    grader_api_key: str = ""
    grader_model: str = "gpt-4o-mini"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"
    grader_timeout_s: float = 60.0

    @property
    def resolved_device(self) -> str:
        if self.device != "auto":
            return self.device
        try:  # pragma: no cover - depends on torch presence
            import torch

            return "cuda" if torch.cuda.is_available() else "cpu"
        except Exception:
            return "cpu"


@lru_cache
def get_settings() -> Settings:
    return Settings()
