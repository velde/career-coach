import os
from dotenv import load_dotenv
from career_qa import (
    collect_answers,
    analyze_with_llm,
    save_answers_to_file,
    load_answers_from_file
)

import json

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("Missing OPENAI_API_KEY. Add it to your .env file.")

print("🧠 Welcome to the Career Coach Q&A!\n")
print("1. Start a new session")
print("2. Load a saved session")
choice = input("Choose an option (1 or 2): ")

if choice == "2":
    answers = load_answers_from_file()
    if not answers:
        print("Starting a new session instead.")
        answers = collect_answers()
else:
    answers = collect_answers()
    save = input("\nDo you want to save your responses? (y/n): ").lower()
    if save == "y":
        save_answers_to_file(answers)

print("\nAnalyzing your profile with GPT...\n")
result = analyze_with_llm(answers, api_key)

print("\n===== Career Coach Summary =====\n")
print(json.dumps(result, indent=2))
