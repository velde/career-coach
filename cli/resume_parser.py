import pdfplumber
import os
import json
from datetime import datetime

RESUME_DIR = "resumes"
os.makedirs(RESUME_DIR, exist_ok=True)

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

def save_parsed_resume(data):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(RESUME_DIR, f"resume_{timestamp}.json")
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n✅ Resume parsed and saved to {filename}")

def parse_pdf_resume(pdf_path, save_to_file=False):
    print(f"\n📄 Parsing resume: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)
    parsed_data = parse_resume(text)
    if save_to_file:
        save_parsed_resume(parsed_data)
    return parsed_data

if __name__ == "__main__":
    path = input("Enter path to resume PDF: ").strip()
    if os.path.exists(path) and path.lower().endswith(".pdf"):
        data = parse_pdf_resume(path, save_to_file=True)  # Save file in CLI mode
        print("\n===== Resume Preview =====\n")
        print(json.dumps(data, indent=2))
    else:
        print("❌ Invalid file path or format.")
