# ChronoQuest

ChronoQuest is an interactive historical timeline and learning application designed to help users organize, visualize, and master historical events and literature. It combines a brutalist-style timeline with AI-powered data entry and gamified learning modes.

## 🚀 Tech Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion.
*   **Backend**: FastAPI (Python), SQLModel (SQLite).
*   **AI**: Google Gemini 2.5 Flash (via `google-generativeai`).
*   **Containerization**: Docker & Docker Compose.

## ✨ Key Features

### 1. Interactive Timeline
The core of the application is a highly responsive, brutalist-style timeline.
*   **Group by Year & Date**: Events are automatically grouped by Year. Expanding a year reveals specific dates, where multiple events on the same day share a single node to reduce clutter.
*   **Sticky Headers**: Year labels (e.g., "1935") stick to the top of the screen while scrolling through their events, providing context at all times.
*   **Collapsible Groups**: Years with many entries are collapsed by default to keep the view clean. Users can expand them with a click.
*   **Markdown Support**: Event descriptions support rich text (Bold, Italic, Lists) via Markdown rendering.
*   **Filtering**:
    *   **Author Filter**: Filter the timeline to show works by specific authors.
    *   **Tag Filter**: Click on tags (e.g., `#novel`, `#colonialism`) to filter entries.
*   **Search**: Jump to a specific year using the search bar.
*   **Responsive Design**: Fully optimized for mobile and desktop, with a compact bottom navigation bar on mobile devices.

### 2. AI-Powered Data Entry ("Add Notes")
Easily populate the timeline using unstructured text.
*   **AI Extraction**: Paste raw text (e.g., lecture notes, book summaries) into the input field. The integrated Gemini AI extracts structured data:
    *   **Title**
    *   **Date** (Start/End)
    *   **Description** (Summarized)
    *   **Author**
    *   **Tags** (Categorization)
*   **Review System**: Extracted entities are presented for review. Users can edit or delete items before committing them to the database.

### 3. Training Mode (Gamification)
Test your knowledge with interactive games.
*   **Game Hub**: A central menu to choose between different game modes.
*   **Chrono-Sort**:
    *   **Goal**: Drag and drop a set of historical events into the correct chronological order (Oldest to Newest).
    *   **Feedback**: Instant validation with visual cues (Green/Red).
*   **Who Wrote It? (Speed Round)**:
    *   **Goal**: Identify the correct author of a displayed work title.
    *   **Mechanics**: Fast-paced multiple-choice format with 4 options.
    *   **Scoring**: Points awarded for correct answers, with a multiplier for streaks.
*   **Author Selection**:
    *   Customize your training session by selecting specific authors to focus on.
    *   Option to play with a "Random" mix of all available authors.

## 🛠️ Setup & Running

1.  **Prerequisites**: Docker & Docker Compose.
2.  **Environment**: Set your `GEMINI_API_KEY` in `backend/.env` (or passed to Docker).
3.  **Run**:
    ```bash
    docker compose up --build
    ```
4.  **Access**:
    *   Frontend: `http://localhost:3550`
    *   Backend API: `http://localhost:8550`

## 📂 Project Structure

*   `frontend/`: React application.
    *   `src/pages/Timeline.tsx`: Main timeline view.
    *   `src/pages/AddNotes.tsx`: AI input and review screen.
    *   `src/pages/TrainingMode.tsx`: Game hub and logic.
*   `backend/`: FastAPI server.
    *   `main.py`: API endpoints and database logic.
    *   `ai_service.py`: Gemini AI integration.
    *   `models.py`: Database schema (SQLModel).
