import re

def preprocess_text(text: str) -> str:
    """
    Cleans and normalizes OCR-extracted text through standard stages:
    1. Converts text to lowercase.
    2. Removes non-printable control characters and replacement characters.
    3. Collapses consecutive duplicate special/punctuation characters.
    4. Filters out common OCR layout artifacts (e.g. lonely pipe symbols, isolated dots).
    5. Normalizes whitespace to a single space.
    """
    if not text:
        return ""

    # 1. Convert to lowercase
    text = text.lower()

    # 2. Remove control characters and non-printable noise
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = text.replace('\ufffd', '')

    # 3. Remove duplicate special characters (e.g., repeating !!!, ---, ..., ===)
    text = re.sub(r'([!\"#$%&\'()*+,\-./:;<=>?@\[\\\]^_`{|}~])\1+', r'\1', text)

    # 4. Remove OCR artifacts
    # Remove standalone border or divider artifacts (e.g. | or _ or • appearing on their own)
    text = re.sub(r'\s+[\|\\_`~•■]\s+', ' ', text)
    # Remove lonely punctuation characters that have spaces on both sides (often misread dust/lines)
    text = re.sub(r'(?<=^|\s)[!\"#$%&\'()*+,\-./:;<=>?@\[\\\]^_`{|}~](?=$|\s)', ' ', text)

    # 5. Normalize spaces (multiple spaces, tabs, and newlines become a single space)
    text = re.sub(r'\s+', ' ', text)

    return text.strip()
