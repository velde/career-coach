import openai
import json
import os
from datetime import datetime
from openai import OpenAI
from pathlib import Path

SYSTEM_PROMPT = """
You are an AI career coach. Analyze the user's responses about their career preferences, motivations, and skills.

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

def load_questions():
    project_root = Path(__file__).parent.parent
    questions_path = project_root / "shared" / "questions.json"
    
    if not questions_path.exists():
        raise FileNotFoundError(f"questions.json not found at {questions_path}")
    
    with open(questions_path, "r", encoding="utf-8") as f:
        return json.load(f)

def collect_answers():
    """Collect answers to career-related questions."""
    answers = {}
    questions = load_questions()
    
    print("\nPlease answer the following questions about your career goals and preferences:")
    for key, question in questions.items():
        print(f"\n{question}")
        answer = input("Your answer: ").strip()
        answers[key] = answer
    
    return answers

def analyze_with_llm(responses, api_key):
    client = OpenAI(api_key=api_key)

    input_text = "\n".join([f"{k}: {v}" for k, v in responses.items()])

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
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

SESSION_DIR = "sessions"
os.makedirs(SESSION_DIR, exist_ok=True)

def save_answers_to_file(responses):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = os.path.join(SESSION_DIR, f"qa_{timestamp}.json")
    with open(filename, "w") as f:
        json.dump(responses, f, indent=2)
    print(f"\n✅ Saved Q&A responses to {filename}")

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
