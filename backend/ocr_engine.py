import os
os.environ["FLAGS_use_onednn"] = "0"
os.environ["FLAGS_use_mkldnn"] = "0"
os.environ["PADDLE_PDX_ENABLE_MKLDNN_BYDEFAULT"] = "0"
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
                    device="gpu" if self.use_gpu else "cpu",
                    enable_mkldnn=False
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
        try:
            result = self.ocr_instance.predict(img_np)
        except Exception:
            result = self.ocr_instance.ocr(img_np)

        if not result or not result[0]:
            return ""

        text_lines = []
        if isinstance(result[0], dict):
            text_lines = result[0].get('rec_texts', [])
        else:
            for line in result[0]:
                if isinstance(line, (list, tuple)) and len(line) > 1 and isinstance(line[1], (list, tuple)):
                    text = line[1][0]
                    text_lines.append(text)
                else:
                    text_lines.append(str(line))

        return "\n".join(text_lines)
