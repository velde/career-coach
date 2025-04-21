import openai
import re
import json
import os
from datetime import datetime
from openai import OpenAI

# --- Prompt and questions ---

SYSTEM_PROMPT = """
You are an AI career coach. Analyze the user's anonymized answers about their career preferences, motivations, and skills.

Classify the user as one of:
(a) Pivot Candidate
(b) Grow-in-Place Candidate
(c) Reinvention-Ready

Extract:
- Top motivations
- Preferred industries
- Skills to improve
- Suggested next steps or roles

Return your response as JSON.
"""

questions = {
    "motivations": "What motivates you most in your work?",
    "ideal_role": "Describe your ideal role or responsibilities.",
    "environment": "What kind of work environment or company culture do you prefer?",
    "industries": "What industries are you most interested in or want to avoid?",
    "skills": "What are your current strengths and what skills do you think you're missing?",
    "openness": "Are you open to changing industries or job functions? Why or why not?"
}

# --- Core Q&A flow ---

def anonymize_text(text):
    text = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[REDACTED NAME]', text)
    text = re.sub(r'\b[A-Z][a-z]+ Inc\.?\b', '[REDACTED COMPANY]', text)
    text = re.sub(r'\b[A-Z]{2,}\b', '[REDACTED ACRONYM]', text)
    return text


def collect_answers(interactive=True, predefined_answers=None):
    responses = {}
    for key, question in questions.items():
        if interactive:
            print(f"\n{question}")
            answer = input("Your answer: ").strip()
        else:
            answer = predefined_answers.get(key, "")
        responses[key] = anonymize_text(answer)
    return responses


def analyze_with_llm(responses, api_key):
    client = OpenAI(api_key=api_key)

    input_text = "\n".join([f"{k}: {v}" for k, v in responses.items()])

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  # Or "gpt-4-turbo" if you have access
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": input_text}
        ],
        temperature=0.5
    )

    result = response.choices[0].message.content
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        return {"raw_response": result, "error": "Invalid JSON"}

# --- Save/load functions ---

SESSION_DIR = "sessions"
os.makedirs(SESSION_DIR, exist_ok=True)


def save_answers_to_file(responses):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(SESSION_DIR, f"qa_{timestamp}.json")
    with open(filename, "w") as f:
        json.dump(responses, f, indent=2)
    print(f"\n✅ Saved responses to {filename}")


def list_saved_sessions():
    files = sorted(
        f for f in os.listdir(SESSION_DIR)
        if f.startswith("qa_") and f.endswith(".json")
    )
    return files


def load_answers_from_file():
    sessions = list_saved_sessions()
    if not sessions:
        print("No saved sessions found.")
        return None

    print("\nAvailable sessions:")
    for i, fname in enumerate(sessions):
        print(f"[{i+1}] {fname}")

    choice = input("Select a session to load: ")
    try:
        idx = int(choice) - 1
        file_path = os.path.join(SESSION_DIR, sessions[idx])
        with open(file_path) as f:
            data = json.load(f)
        print(f"\n✅ Loaded session: {sessions[idx]}")
        return data
    except (ValueError, IndexError):
        print("Invalid selection.")
        return None
