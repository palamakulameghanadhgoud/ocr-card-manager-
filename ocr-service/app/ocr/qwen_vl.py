"""Qwen2.5-VL OCR backend.

Two execution modes, tried in order:
  1. A vLLM OpenAI-compatible endpoint (``VLLM_BASE_URL``) — recommended for
     batched, multi-GPU throughput on the A100 host.
  2. Local HuggingFace ``transformers`` (``device_map=auto``) when vLLM is not
     configured but torch/transformers are installed.

The model both transcribes handwriting and returns question/answer segments in
a single structured pass (see ``vlm_prompt``).
"""
from __future__ import annotations

import base64
import io
import logging
from typing import List

import httpx
from PIL import Image

from ..config import get_settings
from .base import OcrBackend, PageOcr
from .vlm_prompt import STRUCTURED_OCR_PROMPT, parse_structured_ocr

logger = logging.getLogger(__name__)


def _image_to_data_uri(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


class Qwen2VLBackend(OcrBackend):
    name = "qwen2vl"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._local = None  # lazily-loaded (model, processor) for transformers mode

    @classmethod
    def is_available(cls) -> bool:
        settings = get_settings()
        if settings.vllm_base_url:
            return True
        try:  # local transformers path
            import torch  # noqa: F401
            import transformers  # noqa: F401

            return True
        except Exception:
            return False

    # ------------------------------------------------------------------ vLLM
    def _recognize_vllm(self, images: List[Image.Image]) -> List[PageOcr]:
        base = self.settings.vllm_base_url.rstrip("/")
        headers = {"Authorization": f"Bearer {self.settings.vllm_api_key}"}
        results: List[PageOcr] = []
        with httpx.Client(timeout=120.0) as client:
            for image in images:
                payload = {
                    "model": self.settings.qwen_model_id,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": STRUCTURED_OCR_PROMPT},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": _image_to_data_uri(image)},
                                },
                            ],
                        }
                    ],
                    "temperature": 0.0,
                    "max_tokens": 4096,
                }
                resp = client.post(f"{base}/chat/completions", json=payload, headers=headers)
                resp.raise_for_status()
                raw = resp.json()["choices"][0]["message"]["content"]
                parsed = parse_structured_ocr(raw)
                results.append(PageOcr(text=parsed.text, segments=parsed.segments))
        return results

    # ----------------------------------------------------------- transformers
    def _ensure_local(self):  # pragma: no cover - requires torch + weights
        if self._local is not None:
            return self._local
        import torch
        from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            self.settings.qwen_model_id,
            torch_dtype=torch.bfloat16,
            device_map="auto",
        )
        processor = AutoProcessor.from_pretrained(self.settings.qwen_model_id)
        self._local = (model, processor)
        return self._local

    def _recognize_local(self, images: List[Image.Image]) -> List[PageOcr]:  # pragma: no cover
        from qwen_vl_utils import process_vision_info

        model, processor = self._ensure_local()
        results: List[PageOcr] = []
        for image in images:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image},
                        {"type": "text", "text": STRUCTURED_OCR_PROMPT},
                    ],
                }
            ]
            prompt = processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = processor(
                text=[prompt], images=image_inputs, videos=video_inputs,
                padding=True, return_tensors="pt",
            ).to(model.device)
            generated = model.generate(**inputs, max_new_tokens=4096, do_sample=False)
            trimmed = generated[:, inputs.input_ids.shape[1]:]
            raw = processor.batch_decode(
                trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]
            parsed = parse_structured_ocr(raw)
            results.append(PageOcr(text=parsed.text, segments=parsed.segments))
        return results

    # ------------------------------------------------------------------ main
    def recognize(self, images: List[Image.Image]) -> List[PageOcr]:
        if self.settings.vllm_base_url:
            return self._recognize_vllm(images)
        return self._recognize_local(images)
