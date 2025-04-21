import os
import json
from openai import OpenAI
from datetime import datetime

REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

def load_json_file(prompt_text, directory, prefix):
    files = sorted(f for f in os.listdir(directory) if f.startswith(prefix) and f.endswith(".json"))
    if not files:
        print(f"No files found in {directory} with prefix '{prefix}'.")
        return None
    print(f"\nAvailable {prefix} files:")
    for i, fname in enumerate(files):
        print(f"[{i+1}] {fname}")
    choice = input(prompt_text)
    try:
        idx = int(choice) - 1
        path = os.path.join(directory, files[idx])
        with open(path) as f:
            return json.load(f)
    except (ValueError, IndexError):
        print("Invalid selection.")
        return None

def merge_profile(resume_json, qa_json):
    return {
        "resume": resume_json.get("parsed", {}),
        "anonymized_resume_text": resume_json.get("anonymized_text", ""),
        "qa_responses": qa_json
    }

def clean_llm_response(content: str) -> str:
    content = content.strip()
    if content.startswith("```json"):
        content = content[len("```json"):].strip()
    if content.endswith("```"):
        content = content[:-3].strip()
    return content

def analyze_profile(profile, api_key):
    client = OpenAI(api_key=api_key)

    prompt = f"""
You are an expert career coach. Analyze the following candidate profile, which includes a parsed resume and answers to career-related questions.

Your job is to:
1. Determine if this candidate should pivot, grow in place, or reinvent.
2. Identify key motivations and strengths.
3. Highlight skill gaps or areas to improve.
4. Suggest a list of suitable job titles and industries.
5. Recommend personalized next steps.

Return your response as a structured JSON object with keys: "profile_type", "summary", "strengths", "gaps", "recommendations", and "suggested_jobs".

Candidate Profile:
{json.dumps(profile, indent=2)}
    """

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a career coach assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )

    content = response.choices[0].message.content
    raw = content.strip()
    cleaned = clean_llm_response(raw)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "error": "Response was not valid JSON",
            "raw_response": raw
        }

def save_coaching_report(report, summary_text=None):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = os.path.join(REPORTS_DIR, f"coaching_report_{timestamp}.json")

    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n✅ Coaching report saved to {json_path}")

    if summary_text:
        txt_path = os.path.join(REPORTS_DIR, f"coaching_summary_{timestamp}.txt")
        with open(txt_path, "w") as f:
            f.write(summary_text)
        print(f"📝 Human-readable summary saved to {txt_path}")

def format_list(label, items, emoji):
    if not items:
        return f"{emoji} {label}: (none)\n"
    lines = "\n".join([f"  - {item}" for item in items])
    return f"{emoji} {label}:\n{lines}\n"

def fix_character_split(value):
    """Convert ['F', 'o', 'o'] → 'Foo' if it's a character list."""
    if isinstance(value, list) and len(value) > 10 and all(isinstance(c, str) and len(c) == 1 for c in value):
        return "".join(value).strip()
    return value

def normalize_report_fields(report):
    keys = ["summary", "strengths", "gaps", "recommendations", "suggested_jobs"]
    for key in keys:
        val = report.get(key)
        if isinstance(val, list):
            fixed = fix_character_split(val)
            if isinstance(fixed, str):
                report[key] = [fixed]
            else:
                report[key] = fixed
        elif isinstance(val, str):
            report[key] = val.strip() if key == "summary" else [val.strip()]
    return report

def print_human_summary(report):
    if "error" in report:
        print("\n⚠️ Could not parse response:")
        print(report.get("raw_response", "No content available."))
        return None

    report = normalize_report_fields(report)

    lines = []
    lines.append(f"\n🧭 Profile Type: {report.get('profile_type', 'N/A')}")
    lines.append(f"\n📋 Summary:\n{report.get('summary', '')}")

    lines.append(format_list("Strengths", report.get("strengths", []), "✅"))
    lines.append(format_list("Skill Gaps", report.get("gaps", []), "⚠️"))
    lines.append(format_list("Recommendations", report.get("recommendations", []), "🎯"))
    lines.append(format_list("Suggested Jobs", report.get("suggested_jobs", []), "👔"))

    full_summary = "\n".join(lines)
    print(full_summary)
    return full_summary

def run_profile_analysis(api_key, qa_data=None, resume_data=None):
    print("\n=== PROFILE ANALYSIS ===")

    if not resume_data:
        resume_data = load_json_file("Select resume file: ", "resumes", "resume_")
    if not qa_data:
        qa_data = load_json_file("Select Q&A file: ", "sessions", "qa_")

    if not resume_data or not qa_data:
        print("❌ Could not load both resume and Q&A files.")
        return

    profile = merge_profile(resume_data, qa_data)
    report = analyze_profile(profile, api_key)
    summary = print_human_summary(report)
    save_coaching_report(report, summary_text=summary)
