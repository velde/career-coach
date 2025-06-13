# Career Coach Backend

This is the backend for the Career Coach application, built with FastAPI. It handles resume parsing, career Q&A sessions, and job matching.

## Features

- Resume parsing and analysis
- Career Q&A sessions
- Personalized coaching reports
- Job matching based on profile analysis

## Tech Stack

- FastAPI
- OpenAI API
- pdfplumber for PDF parsing
- Deployed on Render

## Getting Started

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/velde/career-coach.git
   cd career-coach/backend
   ```

2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```

3. Start the server:
   ```sh
   uvicorn app:app --reload --port 8000
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## API Endpoints

- `POST /upload_resume`: Upload and parse a PDF resume
- `POST /analyze`: Analyze resume and answers
- `POST /find_jobs`: Find matching job opportunities
- `GET /questions`: Get career reflection questions
- `GET /health`: Health check endpoint

