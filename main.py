# main.py

import os
from dotenv import load_dotenv
from career_qa import collect_answers, analyze_with_llm

load_dotenv()  # Load from .env

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("Missing OPENAI_API_KEY. Add it to your .env file.")

print("Welcome to the AI Career Coach!")
answers = collect_answers(interactive=True)

print("\nAnalyzing your profile...\n")
result = analyze_with_llm(answers, api_key)

import json
print(json.dumps(result, indent=2))
