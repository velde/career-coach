# Career Coach Backend

FastAPI backend for the Career Coach application.

## Setup

1. Create a virtual environment in the project root:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies from the project root:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export OPENAI_API_KEY=your_key_here
```

4. Run the server:
```bash
cd backend
uvicorn app:app --reload --port 8000
```

## API Endpoints

- `POST /upload_resume`: Upload and parse a PDF resume
- `POST /analyze`: Analyze resume and answers
- `POST /find_jobs`: Find matching job opportunities
- `GET /questions`: Get career reflection questions
- `GET /health`: Health check endpoint

