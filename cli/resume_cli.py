import os
import json
from datetime import datetime
from core.resume_parser import parse_pdf_resume

RESUME_DIR = "resumes"
os.makedirs(RESUME_DIR, exist_ok=True)

def save_parsed_resume(data):
    """Save parsed resume data to a JSON file."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(RESUME_DIR, f"resume_{timestamp}.json")
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n✅ Resume parsed and saved to {filename}")

def main():
    """CLI entry point for resume parsing."""
    path = input("Enter path to resume PDF: ").strip()
    if os.path.exists(path) and path.lower().endswith(".pdf"):
        print(f"\n📄 Parsing resume: {path}")
        data = parse_pdf_resume(path)
        save_parsed_resume(data)
        print("\n===== Resume Preview =====\n")
        print(json.dumps(data, indent=2))
    else:
        print("❌ Invalid file path or format.")

if __name__ == "__main__":
    main() 