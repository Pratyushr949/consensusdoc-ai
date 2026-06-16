import pdfplumber
from pathlib import Path
from typing import List, Union

class PDFSplitter:
    """
    Handles page-by-page splitting of a PDF file using pdfplumber.
    Maintains a reference to the opened pdfplumber.PDF object to keep
    the file descriptor open during page processing.
    """
    def __init__(self, pdf_path: Union[str, Path]):
        self.pdf_path = Path(pdf_path)
        self.pdf = None
        self.pages = []

    def split(self) -> List[pdfplumber.page.Page]:
        """
        Opens the PDF and returns the list of page objects.
        """
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found at {self.pdf_path}")
        
        self.pdf = pdfplumber.open(self.pdf_path)
        self.pages = self.pdf.pages
        return self.pages

    def close(self):
        """
        Closes the underlying pdfplumber PDF file handle.
        """
        if self.pdf:
            self.pdf.close()
            self.pdf = None
            self.pages = []

    def __enter__(self):
        self.split()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
