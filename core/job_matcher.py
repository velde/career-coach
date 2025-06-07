import os
from openai import OpenAI
from typing import List, Dict
import json

# Initialize OpenAI client only if API key is available
client = None
if os.getenv("OPENAI_API_KEY"):
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def find_matching_jobs(coaching_summary: Dict, num_jobs: int = 5) -> List[Dict]:
    """
    Use OpenAI to find matching jobs based on the career coaching summary.
    Returns a list of job matches with titles, descriptions, and match reasons.
    """
    if not client:
        print("OpenAI client not initialized - API key not found")
        return []

    system_prompt = """You are a job matching expert. Your task is to find relevant job opportunities 
    based on the candidate's career coaching summary. For each job, provide:
    1. A realistic job title
    2. A brief job description
    3. Why this job matches the candidate's profile and career direction
    4. Required skills that the candidate has
    5. Skills the candidate might need to develop
    
    Focus on jobs that align with the candidate's:
    - Career direction (Pivot, Grow, or Reinvent)
    - Identified strengths
    - Career goals and preferences
    - Areas for growth
    
    Be specific and realistic in your job suggestions, considering the candidate's current level
    and potential for growth in their chosen direction.
    
    IMPORTANT: Your response must be a valid JSON object with a "jobs" array containing the job matches."""

    # Extract relevant information from the coaching summary
    profile_type = coaching_summary.get('profile_type', '')
    summary = coaching_summary.get('summary', '')
    strengths = coaching_summary.get('strengths', [])
    gaps = coaching_summary.get('gaps', [])
    recommendations = coaching_summary.get('recommendations', [])
    suggested_jobs = coaching_summary.get('suggested_jobs', [])
    
    user_prompt = f"""Based on this career coaching summary:
    
    Profile Type: {profile_type}
    
    Summary:
    {summary}
    
    Strengths:
    {json.dumps(strengths, indent=2)}
    
    Areas for Growth:
    {json.dumps(gaps, indent=2)}
    
    Recommendations:
    {json.dumps(recommendations, indent=2)}
    
    Initially Suggested Roles:
    {json.dumps(suggested_jobs, indent=2)}
    
    Find {num_jobs} matching job opportunities that would be a good fit for this candidate's career direction.
    For each job, provide:
    1. Job Title
    2. Job Description
    3. Match Reasons (explain how this job aligns with their career direction and goals)
    4. Matching Skills (from their strengths)
    5. Skills to Develop (based on their gaps and recommendations)
    
    Format the response as a JSON object with a "jobs" array containing the job matches.
    Example format:
    {{
      "jobs": [
        {{
          "Job Title": "Example Job",
          "Job Description": "Description here",
          "Match Reasons": "Reasons here",
          "Matching Skills": ["Skill 1", "Skill 2"],
          "Skills to Develop": ["Skill 3", "Skill 4"]
        }}
      ]
    }}"""

    print("Sending request to OpenAI...")
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={ "type": "json_object" }
    )

    try:
        print("Received response from OpenAI")
        content = response.choices[0].message.content
        print("Response content:", content)
        jobs = json.loads(content)
        if not isinstance(jobs, dict) or 'jobs' not in jobs:
            print("Invalid response format - missing 'jobs' key")
            return []
        if not isinstance(jobs['jobs'], list):
            print("Invalid response format - 'jobs' is not a list")
            return []
        print(f"Found {len(jobs['jobs'])} job matches")
        return jobs['jobs']
    except json.JSONDecodeError as e:
        print("Failed to parse JSON response:", e)
        print("Raw response:", response.choices[0].message.content)
        return []
    except Exception as e:
        print("Unexpected error:", e)
        return [] 