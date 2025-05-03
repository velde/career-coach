# Career Coach

An AI-powered assistant that interviews job seekers and analyzes their responses using GPT-4 to help them discover their career direction, strengths, and growth areas.

## Features
- Interactive career interview
- Anonymization of personal details
- GPT-4 based analysis & classification

This mono-repo contains:

- **cli/** — original CLI tool (`main.py`, parsing, Q&A, GPT analysis)  
- **backend/** — FastAPI web API wrapping the same modules  
- **frontend/** — React single-page app that talks to the API  

See each subfolder for setup instructions.

# Instructions

Create a `.env` file with your OpenAI key:

```
OPENAI_API_KEY=your-api-key-here
```

## License
MIT

