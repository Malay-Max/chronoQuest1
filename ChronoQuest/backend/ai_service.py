import os
import json
import google.generativeai as genai
from typing import Dict, Any

# Configure Gemini
# Ideally, this should be loaded from environment variables
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-2.5-flash')

SYSTEM_PROMPT = """
You are a historian. Extract structured data from the provided text. 
Return ONLY valid JSON with keys: 'authors' (list) and 'entities' (list). 
Convert all fuzzy dates (e.g., 'Late 1860s') into specific ISO 8601 dates (e.g., '1868-01-01').
For 'entities', the 'type' field must be either 'WORK' or 'EVENT'.
For 'authors', include 'name', 'birth_year', 'death_year', 'bio'.
For 'entities', include 'title', 'type', 'date_start', 'date_end', 'description', 'tags', and 'author' (the name of the author if applicable).
If an entity is associated with an author mentioned in the text, you MUST include the 'author' field with the author's exact name.
"""

async def extract_data_from_text(text: str) -> Dict[str, Any]:
    if not api_key:
        print("Error: GEMINI_API_KEY not set")
        raise ValueError("GEMINI_API_KEY not set")

    try:
        print(f"Sending request to Gemini with text length: {len(text)}")
        response = model.generate_content(
            f"{SYSTEM_PROMPT}\n\nText to analyze:\n{text}",
            generation_config={"response_mime_type": "application/json"}
        )
        
        print(f"Gemini response: {response.text}")
        return json.loads(response.text)
    except Exception as e:
        print(f"Error extracting data: {e}")
        import traceback
        traceback.print_exc()
        # Return empty structure on failure to avoid crashing
        return {"authors": [], "entities": []}

async def generate_mystery_game(title: str, author: str, description: str) -> Dict[str, Any]:
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    prompt = f"""
    You are a literary expert creating a trivia game.
    
    Target Work: "{title}" by {author}.
    Original Description: {description}

    Task:
    1. Write a vague, cryptic description of this work in 2 sentences. Focus on themes, feelings, or a minor character's perspective. DO NOT use the names "{title}", "{author}", or major character names that give it away immediately. It should be challenging but solvable for someone who knows the work.
    2. Generate 3 incorrect but plausible titles that could fit this vague description. These should be real or realistic-sounding titles, but clearly NOT the correct answer.

    Return ONLY valid JSON:
    {{
        "vague_description": "...",
        "correct_answer": "{title}",
        "distractors": ["Wrong Title 1", "Wrong Title 2", "Wrong Title 3"]
    }}
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating mystery game: {e}")
        # Fallback
        return {
            "vague_description": f"A work by {author} involving {description[:20]}...",
            "correct_answer": title,
            "distractors": ["Unknown Work 1", "Unknown Work 2", "Unknown Work 3"]
        }
