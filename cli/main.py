import os
from dotenv import load_dotenv
from core.career_qa import (
    collect_answers,
    save_answers_to_file,
    load_answers_from_file
)
from core.resume_parser import parse_pdf_resume
from core.profile_analyzer import (
    run_profile_analysis,
    analyze_profile,
    merge_profile,
    print_human_summary,
    save_coaching_report,
    load_json_file,
)

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
    resume_data = None
else:
    resume_data = None

# === Profile Analysis & Coaching ===
print("\n🧠 Launching profile analysis...")

resume_data = resume_data or load_json_file("Select resume file: ", "resumes", "resume_")
qa_data = qa_answers or load_json_file("Select Q&A file: ", "sessions", "qa_")

if not resume_data or not qa_data:
    print("❌ Could not continue without both resume and Q&A.")
    exit()

profile = merge_profile(resume_data, qa_data)
report = analyze_profile(profile, api_key)
summary = print_human_summary(report)
save_coaching_report(report, summary_text=summary)
