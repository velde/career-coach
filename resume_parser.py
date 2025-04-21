import pdfplumber
import os
import json
from datetime import datetime
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

# === Setup ===
RESUME_DIR = "resumes"
os.makedirs(RESUME_DIR, exist_ok=True)

# Initialize Presidio with spaCy small model
configuration = {
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
}
provider = NlpEngineProvider(nlp_configuration=configuration)
nlp_engine = provider.create_engine()
analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
anonymizer = AnonymizerEngine()

# === Text Extraction ===
def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

# === Anonymization (filtered) ===
def anonymize_text(text):
    allowed_entities = [
        "PERSON", "ORG", "EMAIL_ADDRESS", "PHONE_NUMBER", "URL", "LOCATION"
    ]
    results = analyzer.analyze(text=text, language="en", entities=allowed_entities)
    anonymized_result = anonymizer.anonymize(text=text, analyzer_results=results)
    return anonymized_result.text

# === Resume Parsing ===
def extract_section(text, keywords):
    import re
    pattern = '|'.join(re.escape(kw) for kw in keywords)
    return re.findall(rf'({pattern})(.*?)(?=\n[A-Z\s]{{2,}}|\Z)', text, re.DOTALL | re.IGNORECASE)

def parse_resume(text):
    return {
        "education": extract_section(text, ["Education", "EDUCATION"]),
        "experience": extract_section(text, ["Experience", "EXPERIENCE", "Work History"]),
        "skills": extract_section(text, ["Skills", "SKILLS", "Technologies"]),
        "raw_text_preview": text[:1000] + "..."
    }

def save_parsed_resume(data, anonymized_text):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(RESUME_DIR, f"resume_{timestamp}.json")

    to_save = {
        "parsed": data,
        "anonymized_text": anonymized_text
    }

    with open(filename, "w") as f:
        json.dump(to_save, f, indent=2)

    print(f"\n✅ Parsed and anonymized resume saved to {filename}")

def parse_pdf_resume(pdf_path):
    print(f"\n📄 Parsing resume: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)
    parsed_data = parse_resume(text)
    anonymized_text = anonymize_text(text)
    save_parsed_resume(parsed_data, anonymized_text)
    return parsed_data

# === CLI Usage ===
if __name__ == "__main__":
    path = input("Enter path to resume PDF: ").strip()
    if os.path.exists(path) and path.lower().endswith(".pdf"):
        data = parse_pdf_resume(path)
        print("\n===== Resume Preview =====\n")
        print(json.dumps(data, indent=2))
    else:
        print("❌ Invalid file path or format.")
