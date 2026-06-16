import os
os.environ["FLAGS_use_onednn"] = "0"
import numpy as np
import pdfplumber
import yaml
from pathlib import Path

# Monkeypatch re.sub to support variable-width look-behinds (?<=^|\s) on Python 3.11
import re
_orig_sub = re.sub
def _custom_sub(pattern, repl, string, count=0, flags=0):
    if isinstance(pattern, str) and '(?<=^|\\s)' in pattern:
        p1 = pattern.replace('(?<=^|\\s)', '(?<=^)')
        p2 = pattern.replace('(?<=^|\\s)', '(?<=\\s)')
        string = _orig_sub(p1, repl, string, count, flags)
        string = _orig_sub(p2, repl, string, count, flags)
        return string
    return _orig_sub(pattern, repl, string, count, flags)
re.sub = _custom_sub

from paddleocr import PaddleOCR

class OCREngine:
    """
    OCR Engine wrapper around PaddleOCR.
    Converts pdfplumber page objects into images and performs OCR text extraction.
    """
    def __init__(self, use_gpu: bool = False, lang: str = "en"):
        self.use_gpu = use_gpu
        self.lang = lang
        self._load_config()
        self._ocr = None

    def _load_config(self):
        possible_paths = [
            Path("config/config.yaml"),
            Path("project2/config/config.yaml"),
            Path("../config/config.yaml")
        ]
        for p in possible_paths:
            if p.exists():
                try:
                    with open(p, "r") as f:
                        config = yaml.safe_load(f)
                        if config and "ocr" in config:
                            ocr_cfg = config["ocr"]
                            self.use_gpu = ocr_cfg.get("use_gpu", self.use_gpu)
                            self.lang = ocr_cfg.get("lang", self.lang)
                    break
                except Exception:
                    pass

    @property
    def ocr_instance(self) -> PaddleOCR:
        if self._ocr is None:
            # Lazy initialize the PaddleOCR model to optimize startup time and memory
            try:
                self._ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang=self.lang,
                    use_gpu=self.use_gpu,
                    show_log=True
                )
            except Exception as e:
                raise RuntimeError(f"OCR initialization failed: {str(e)}")
        return self._ocr

    def extract_text(self, page: pdfplumber.page.Page) -> str:
        """
        Accepts one pdfplumber Page, converts it to an image,
        performs OCR extraction, and returns the raw text.
        """
        # Convert PDF page to image (resolution 150 provides a balanced size for OCR)
        page_image = page.to_image(resolution=150)
        pil_image = page_image.original.convert("RGB")
        
        # Convert PIL image to numpy array for PaddleOCR input
        img_np = np.array(pil_image)

        # Run OCR extraction
        result = self.ocr_instance.ocr(img_np, cls=True)

        if not result or not result[0]:
            return ""

        text_lines = []
        for line in result[0]:
            # Extract text from the result structure: [geometry, (text_str, confidence_score)]
            text = line[1][0]
            text_lines.append(text)

        return "\n".join(text_lines)
