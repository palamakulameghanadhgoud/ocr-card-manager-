"""SimpleHTR OCR backend using TensorFlow and line-level segmentation."""
from __future__ import annotations

import logging
import os
import sys
import threading
from typing import List

from PIL import Image

from ..config import get_settings
from .base import OcrBackend, PageOcr

logger = logging.getLogger(__name__)

# Ensure SimpleHTR src path is available for imports
SIMPLE_HTR_SRC = "d:/ocr/ocr-card-manager-/SimpleHTR/src"
if SIMPLE_TR_SRC_PATH := os.path.abspath(SIMPLE_HTR_SRC):
    if SIMPLE_TR_SRC_PATH not in sys.path:
        sys.path.append(SIMPLE_TR_SRC_PATH)


def _split_lines(image: Image.Image) -> List[Image.Image]:
    """Segment a page into line images via horizontal ink projection."""
    try:
        import cv2
        import numpy as np
    except Exception:
        return [image]

    # Convert to grayscale and binarize
    gray = np.array(image.convert("L"))
    binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    h, w = binary.shape

    # 1. Mask outer 3% margin to remove scanner edges, page borders, or black shadows
    margin_y = int(h * 0.03)
    margin_x = int(w * 0.03)
    if margin_y > 0 and margin_x > 0:
        binary[:margin_y, :] = 0
        binary[-margin_y:, :] = 0
        binary[:, :margin_x] = 0
        binary[:, -margin_x:] = 0

    # 2. Filter out large border contours (e.g. bounding boxes or table lines)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in contours:
        x, y, w_box, h_box = cv2.boundingRect(c)
        # If a contour is extremely wide or tall, it's a page border/line, not text
        if w_box > w * 0.75 or h_box > h * 0.75:
            cv2.drawContours(binary, [c], -1, 0, -1)

    # 3. Sum row ink for projection profile
    row_ink = binary.sum(axis=1)
    # Use a low threshold to catch lighter handwriting
    threshold = row_ink.max() * 0.015 if row_ink.max() else 0

    lines: List[Image.Image] = []
    start = None
    for y, value in enumerate(row_ink):
        if value > threshold and start is None:
            start = y
        elif value <= threshold and start is not None:
            # 10px minimum height to ignore small specks, rules, or dots
            if y - start > 10:
                # Crop the original image with a 4px vertical padding for context
                lines.append(image.crop((0, max(0, start - 4), image.width, min(image.height, y + 4))))
            start = None
    if start is not None:
        if h - start > 10:
            lines.append(image.crop((0, max(0, start - 4), image.width, h)))
            
    return lines or [image]


class SimpleHTRBackend(OcrBackend):
    name = "simplehtr"

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self._model = None
        self._preprocessor = None

    @classmethod
    def is_available(cls) -> bool:
        """Check if SimpleHTR repo and model files are present."""
        checkpoint_path = "d:/ocr/ocr-card-manager-/SimpleHTR/model/checkpoint"
        return os.path.exists(checkpoint_path)

    def _ensure_model(self):
        if self._model is not None:
            return self._model, self._preprocessor

        # SimpleHTR internally expects CWD to be its 'src' folder to resolve model/ paths
        old_cwd = os.getcwd()
        try:
            os.chdir(SIMPLE_HTR_SRC)
            os.environ["OPENBLAS_NUM_THREADS"] = "1"

            from model import Model, DecoderType
            from preprocessor import Preprocessor

            char_list = []
            with open("../model/charList.txt") as f:
                char_list = list(f.read())

            # Load the line-level pretrained model using TF1 compat mode
            model = Model(char_list, DecoderType.BestPath, must_restore=True)
            # Resize height to 32, enable dynamic width padding
            preprocessor = Preprocessor((256, 32), dynamic_width=True, padding=16)

            self._model = model
            self._preprocessor = preprocessor
            logger.info("SimpleHTR loaded successfully from snapshot.")
        finally:
            os.chdir(old_cwd)

        return self._model, self._preprocessor

    def recognize(self, images: List[Image.Image]) -> List[PageOcr]:
        model, preprocessor = self._ensure_model()
        
        from dataloader_iam import Batch
        import cv2
        import numpy as np

        results: List[PageOcr] = []
        with self.lock:
            for page_idx, image in enumerate(images):
                line_texts: List[str] = []
                lines = _split_lines(image)
                logger.info(f"SimpleHTR: Page {page_idx} segmented into {len(lines)} line(s).")

                for line_idx, line_img in enumerate(lines):
                    # Convert PIL image to grayscale numpy array
                    gray = np.array(line_img.convert("L"))
                    
                    # Run preprocessor
                    processed_img = preprocessor.process_img(gray)
                    
                    # Construct batch of size 1
                    batch = Batch([processed_img], None, 1)
                    
                    # Run TF inference
                    recognized, probs = model.infer_batch(batch, calc_probability=True)
                    text = recognized[0].strip() if recognized else ""
                    prob = probs[0] if probs else 0.0
                    
                    logger.info(f"  Line {line_idx}/{len(lines)}: Recognized='{text}' (confidence={prob:.4f})")
                    if text:
                        line_texts.append(text)

                results.append(PageOcr(text="\n".join(line_texts)))

        return results
