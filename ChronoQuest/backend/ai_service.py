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
Ensure all property names and string values are enclosed in DOUBLE QUOTES. Do NOT use single quotes for JSON keys or values.
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

    import asyncio
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"Sending request to Gemini with text length: {len(text)} (Attempt {attempt + 1}/{max_retries})")
            response = model.generate_content(
                f"{SYSTEM_PROMPT}\n\nText to analyze:\n{text}",
                generation_config={"response_mime_type": "application/json"}
            )
            
            print(f"Gemini response: {response.text}")
            
            # Clean response text (remove markdown code blocks if present)
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
                
            cleaned_text = cleaned_text.strip()
            
            data = json.loads(cleaned_text)
            
            # Handle case where AI returns a list of entities directly
            if isinstance(data, list):
                data = {"entities": data, "authors": []}
            
            # Ensure required keys exist
            if "authors" not in data:
                data["authors"] = []
            if "entities" not in data:
                data["entities"] = []
                
            # Recursively sanitize data to remove NaN
            def sanitize(obj):
                if isinstance(obj, float) and (obj != obj): # Check for NaN
                    return None
                if isinstance(obj, dict):
                    return {k: sanitize(v) for k, v in obj.items()}
                if isinstance(obj, list):
                    return [sanitize(x) for x in obj]
                return obj
                
            return sanitize(data)
            
        except Exception as e:
            print(f"Error extracting data (Attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1:
                import traceback
                traceback.print_exc()
                return {"authors": [], "entities": []}
            # Wait briefly before retrying
            await asyncio.sleep(1)

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

async def generate_quote_game(title: str, author: str) -> Dict[str, Any]:
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    prompt = f"""
    You are a literature professor creating an exam.
    
    Target Work: "{title}" by {author}.

    Task:
    1. Determine if this is a MAJOR, well-known work that has famous, recognizable quotes often asked in exams. 
    2. If NO (it's obscure, minor, or has no famous quotes), return {{"valid": false}}.
    3. If YES, provide:
       - A famous, verbatim quote from the text (do not include the speaker's name in the quote).
       - The Speaker (Character Name OR Author Name if it's non-fiction/poetry).
       - 3 Distractors (other characters from the same book, or other authors if applicable).

    Return ONLY valid JSON:
    {{
        "valid": true,
        "quote": "To be, or not to be...",
        "speaker": "Hamlet",
        "distractors": ["Claudius", "Polonius", "Horatio"]
    }}
    OR
    {{
        "valid": false
    }}
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating quote game: {e}")

async def generate_redacted_game(title: str, author: str, description: str) -> Dict[str, Any]:
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    prompt = f"""
    You are a classified intelligence officer creating a redacted document puzzle.

    Target Work: "{title}" by {author}.
    Context/Description: {description}

    Task:
    1.  Create a short "primary source" style text related to this work or author. It could be a letter, a diary entry, or a report *about* the work. It should be about 3-4 sentences.
    2.  Identify 3-5 key words in this text to redact. These should be names (including the author or characters), dates, or specific locations/objects.
    3.  Replace these key words in the text with a placeholder format: `{{index}}` (e.g., {{0}}, {{1}}).
    4.  Create a list of the correct words corresponding to the indices.
    5.  Create a list of 5-7 "distractor" words that are plausible but incorrect (e.g., other authors, wrong dates, similar concepts).

    Return ONLY valid JSON:
    {{
        "redacted_text": "My dear {{0}}, I have finally finished the {{1}}...",
        "hidden_words": ["Keats", "poem"],
        "distractors": ["Shelley", "novel", "1820", "London"]
    }}
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating redacted game: {e}")
        return {
            "redacted_text": f"The work known as {{0}} was written by {{1}} in {{2}}.",
            "hidden_words": [title, author, "the past"],
            "distractors": ["Shakespeare", "the future", "1999"]
        }
