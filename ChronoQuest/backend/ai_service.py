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
For 'entities', include 'title', 'type', 'date_start', 'date_end', 'description', 'tags'.
If an entity is associated with an author mentioned in the text, try to link them (conceptually, the frontend will handle the ID mapping).
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
