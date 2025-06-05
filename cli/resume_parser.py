import pdfplumber
import os
import json
from datetime import datetime

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_section(text, keywords):
    import re
    pattern = '|'.join(re.escape(kw) for kw in keywords)
    return re.findall(rf'({pattern})(.*?)(?=\n[A-Z\s]{{2,}}|\Z)', text, re.DOTALL | re.IGNORECASE)

def parse_resume(text):
    return {
        "education": extract_section(text, ["Education", "EDUCATION"]),
        "experience": extract_section(text, ["Experience", "EXPERIENCE", "Work History"]),
        "skills": extract_section(text, ["Skills", "SKILLS", "Technologies"]),
        "raw_text": text,
        "raw_text_preview": text[:1000] + "..."
    }

def parse_pdf_resume(pdf_path):
    text = extract_text_from_pdf(pdf_path)
    return parse_resume(text)

if __name__ == "__main__":
    path = input("Enter path to resume PDF: ").strip()
    if os.path.exists(path) and path.lower().endswith(".pdf"):
        data = parse_pdf_resume(path)
        print("\n===== Resume Preview =====\n")
        print(json.dumps(data, indent=2))
    else:
        print("❌ Invalid file path or format.")
