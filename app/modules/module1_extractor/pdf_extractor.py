import fitz

def extract_text(file_bytes):
    text = ""

    doc = fitz.open(stream=file_bytes, filetype="pdf")

    for page in doc:
        text += page.get_text()

    return text