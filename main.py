import os
from dotenv import load_dotenv
from career_qa import (
    collect_answers,
    analyze_with_llm,
    save_answers_to_file,
    load_answers_from_file
)
from resume_parser import parse_pdf_resume
from profile_analyzer import run_profile_analysis, load_json_file

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("Missing OPENAI_API_KEY. Add it to your .env file.")

print("🎯 Welcome to Career Coach CLI\n")

# === Q&A Step ===
print("1. Start a new Q&A session")
print("2. Load a previous Q&A session")
choice = input("Choose an option (1 or 2): ")

if choice == "2":
    qa_answers = load_answers_from_file()
    if not qa_answers:
        print("Starting a new session instead.")
        qa_answers = collect_answers()
else:
    qa_answers = collect_answers()
    save = input("\nDo you want to save your Q&A responses? (y/n): ").lower()
    if save == "y":
        save_answers_to_file(qa_answers)

# === Resume Step ===
print("\n📄 Resume parsing")
resume_path = input("Enter path to your resume PDF (or press Enter to skip and load an existing parsed file): ").strip()

if resume_path and os.path.exists(resume_path):
    parse_pdf_resume(resume_path)
    resume_data = None  # will select later
else:
    resume_data = None

# === Coaching Summary ===
print("\n🧠 Launching profile analysis...")
run_profile_analysis(api_key, qa_data=qa_answers, resume_data=resume_data)
