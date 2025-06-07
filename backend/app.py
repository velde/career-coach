import sys
from pathlib import Path
from pydantic import BaseModel
import json
import os

# Add both core and parent directory to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "core"))

# Import your existing modules
from core.resume_parser import extract_text_from_pdf, parse_resume
from core.career_qa import collect_answers, load_answers_from_file
from core.profile_analyzer import merge_profile, analyze_profile, print_human_summary, save_coaching_report
from core.job_matcher import find_matching_jobs

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tempfile import NamedTemporaryFile
import shutil

class AnalyzeRequest(BaseModel):
    resume: dict
    qa: dict
    session_name: str = "web_session"

class JobMatchRequest(BaseModel):
    coaching_summary: dict
    num_jobs: int = 5

app = FastAPI()
# Add CORS middleware immediately after app creation
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://career-coach-alpha.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    tmp_path = None
    try:
        # Save upload to temp file
        with NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # Ensure file handle is closed
        await file.close()

        # Parse resume
        text = extract_text_from_pdf(tmp_path)
        parsed = parse_resume(text)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")
    finally:
        # Clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception as e:
                print(f"Warning: Failed to delete temp file {tmp_path}: {e}")

@app.post("/start_qa")
def start_qa(session_name: str = None):
    if session_name:
        answers = load_answers_from_file(session_name)
    else:
        answers = collect_answers()
    return answers

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    merged = merge_profile(req.resume, req.qa)
    report = analyze_profile(merged)

    if "error" in report:
        return {
            "summary": "⚠️ GPT response was not valid.",
            "report": report
        }

    summary = print_human_summary(report)
    save_coaching_report(report, summary_text=summary)
    return {"report": report, "summary": summary}

@app.post("/find_jobs")
def find_jobs(req: JobMatchRequest):
    try:
        jobs = find_matching_jobs(req.coaching_summary, req.num_jobs)
        return {"jobs": jobs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/questions")
def get_questions():
    project_root = Path(__file__).resolve().parent.parent
    questions_path = project_root / "shared" / "questions.json"

    if not questions_path.exists():
        raise HTTPException(status_code=500, detail=f"questions.json not found at {questions_path}")
    
    with open(questions_path, "r", encoding="utf-8") as f:
        questions = json.load(f)

    return questions


# To run backend locally:
# 1. install dependencies: pip install fastapi uvicorn
# 2. uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Frontend (React)
# Create a React app in a separate folder, e.g. `npx create-react-app frontend`
# Inside `frontend/src/App.js`:
# --------------------------------
# import React, { useState } from 'react';
#
# function App() {
#   const [file, setFile] = useState(null);
#   const [parsed, setParsed] = useState(null);
#
#   const handleUpload = async () => {
#     const formData = new FormData();
#     formData.append('file', file);
#     const res = await fetch('http://localhost:8000/upload_resume', { method: 'POST', body: formData });
#     const data = await res.json();
#     setParsed(data);
#   };
#
#   return (
#     <div className="p-4">
#       <h1 className="text-xl mb-4">Career Coach</h1>
#       <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
#       <button onClick={handleUpload} className="ml-2 p-2 border rounded">Upload Resume</button>
#       {parsed && <pre className="mt-4 bg-gray-100 p-2">{JSON.stringify(parsed, null, 2)}</pre>}
#     </div>
#   );
# }
#
# export default App;
# --------------------------------
# Add proxy in `frontend/package.json`:
# "proxy": "http://localhost:8000",

# Deployment Considerations:
# - Cloud providers: Vercel (frontend), Heroku / Render / Railway (backend)
# - Set environment variables securely in the cloud dashboard
# - Configure CORS origins to production domains
# - For scaling, consider Docker with a managed container service (AWS ECS, GCP Cloud Run)
