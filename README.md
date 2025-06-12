# Career Coach

**Career Coach** is an AI-powered career reflection tool that helps job seekers gain insight into their strengths, gaps, and potential next steps. It analyzes your resume and self-reflection responses to generate a personalized career coaching report and matching job opportunities — just like working with a career consultant, but automated and scalable.

---

## What It Does

- Upload your **PDF resume**
- **Redact PII (Personally Identifiable Information)** by selecting text and right-clicking - redacted text is completely removed before analysis
- Answer 6 personalized **career reflection questions**
- Receive an AI-generated **coaching report** including:
  - Career direction (Pivot, Grow, Reinvent)
  - Key strengths and skills
  - Gaps and improvement areas
  - Actionable recommendations
  - Suggested job titles and industries
- Get **matching job opportunities** that align with your:
  - Career direction and goals
  - Current skills and experience
  - Areas for growth
  - Each job match includes:
    - Job title and description
    - Why it matches your profile
    - Your matching skills
    - Skills you need to develop

---

## Live Demo

Try it now: [career-coach-alpha.vercel.app](https://career-coach-alpha.vercel.app)  
[Resume parsing and coaching powered by FastAPI on Render](https://career-coach-backend.onrender.com/health)

> No personal data is stored — resume and answers are used only during the session.

---

## Tech Stack

| Layer       | Tools Used                                 |
|-------------|---------------------------------------------|
| Frontend    | React, Fetch API, Vercel                   |
| Backend     | FastAPI, OpenAI API, pdfplumber, Render    |
| AI/LLM      | OpenAI Chat Completions API               |
| Deployment  | Vercel (frontend), Render (backend)        |
| File Parsing| `pdfplumber`                              |
| Prompt Logic| Custom GPT prompts with structured JSON replies |

---

## Architecture

```
[ Vercel Frontend ]
        |
    fetch()
        ↓
[ Render Backend (FastAPI) ]
        ├─ /upload_resume → parse PDF with pdfplumber
        ├─ /questions → loads shared JSON questions
        ├─ /analyze → merges resume + answers, calls OpenAI API
        └─ /find_jobs → matches coaching summary with job opportunities
```

- Shared logic (resume parsing, prompt formatting) is used by both CLI and backend
- All user input is processed in-memory; nothing is stored long-term
- PII redaction happens client-side before analysis to ensure privacy
- Job matching uses the coaching summary to find relevant opportunities

---

## How to Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/velde/career-coach
cd career-coach

# 2. Set up backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r ../requirements.txt
touch .env  # and add your OPENAI_API_KEY

# Run backend
uvicorn app:app --reload --port 8000

# 3. Set up frontend
cd ../frontend
npm install
npm start
```

---

## Why I Built This

I wanted to explore how AI could support meaningful human decision-making in career development where reflection and personalization matter. This project combines natural language processing, prompt engineering, and real-world UX design into a complete end-to-end product.

---

## Future Improvements

- Allow exporting report to PDF
- Add user login to save sessions
- Use fine-tuned models for deeper insight
- Add more job matching sources
- Improve job matching accuracy with feedback

---

## License

This project is open source and free to use for educational and demonstration purposes.