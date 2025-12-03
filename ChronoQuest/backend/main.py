from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from contextlib import asynccontextmanager
from typing import List, Optional

from database import create_db_and_tables, get_session
from models import Author, Entity

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:3550",
    "http://localhost:5173", # Vite default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to ChronoQuest API"}

class EntityRead(Entity):
    author_name: Optional[str] = None

@app.get("/api/timeline", response_model=List[EntityRead])
def get_timeline(session: Session = Depends(get_session)):
    # Join Entity and Author to get author name
    statement = select(Entity, Author.name).outerjoin(Author, Entity.author_id == Author.id).order_by(Entity.date_start)
    results = session.exec(statement).all()
    
    timeline_data = []
    for entity, author_name in results:
        # Create EntityRead from entity data + author_name
        entity_read = EntityRead.model_validate(entity)
        entity_read.author_name = author_name
        timeline_data.append(entity_read)
        
    return timeline_data

from pydantic import BaseModel
from ai_service import extract_data_from_text

class ExtractRequest(BaseModel):
    text: str

@app.post("/api/extract")
async def extract_data(request: ExtractRequest):
    data = await extract_data_from_text(request.text)
    return data

from datetime import datetime

class EntityCreate(BaseModel):
    type: str
    title: str
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    description: str
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    author: Optional[str] = None # Handle alias
    tags: List[str]

class CommitRequest(BaseModel):
    authors: List[Author]
    entities: List[EntityCreate]

@app.post("/api/commit")
def commit_data(data: CommitRequest, session: Session = Depends(get_session)):
    # Map to store author name -> database ID
    author_map = {}

    # Save authors
    for author in data.authors:
        # Check if author exists to avoid duplicates
        existing_author = session.exec(select(Author).where(Author.name == author.name)).first()
        if existing_author:
            author_map[author.name] = existing_author.id
        else:
            session.add(author)
            session.commit()
            session.refresh(author)
            author_map[author.name] = author.id
    
    # Save entities with date conversion
    for entity_data in data.entities:
        # Convert string dates to python date objects
        date_start_obj = None
        if entity_data.date_start:
            try:
                date_start_obj = datetime.strptime(entity_data.date_start, "%Y-%m-%d").date()
            except:
                pass

        date_end_obj = None
        if entity_data.date_end:
            try:
                date_end_obj = datetime.strptime(entity_data.date_end, "%Y-%m-%d").date()
            except:
                pass 
        
        # Convert tags list to string
        tags_str = ", ".join(entity_data.tags) if entity_data.tags else ""
        
        # Resolve Author ID
        final_author_id = entity_data.author_id
        if final_author_id is None:
            # Try to find by name
            name_key = entity_data.author or entity_data.author_name
            if name_key and name_key in author_map:
                final_author_id = author_map[name_key]
        
        # Check for duplicate entity
        # We consider it a duplicate if it has the same Title and Author
        existing_entity = session.exec(select(Entity).where(
            Entity.title == entity_data.title,
            Entity.author_id == final_author_id
        )).first()
        
        if not existing_entity:
            entity = Entity(
                type=entity_data.type,
                title=entity_data.title,
                date_start=date_start_obj,
                date_end=date_end_obj,
                description=entity_data.description,
                author_id=final_author_id,
                tags=tags_str
            )
            session.add(entity)
        
    session.commit()
    return {"status": "success", "message": "Data committed to database"}

import random

@app.get("/api/entities/random", response_model=List[Entity])
def get_random_entities(count: int = 5, session: Session = Depends(get_session)):
    entities = session.exec(select(Entity)).all()
    if len(entities) < count:
        return entities
    return random.sample(entities, count)

from ai_service import generate_mystery_game

@app.post("/api/game/mystery")
async def get_mystery_game(session: Session = Depends(get_session)):
    # Get random entity that has an author
    statement = select(Entity, Author.name).join(Author, Entity.author_id == Author.id)
    results = session.exec(statement).all()
    
    if not results:
        return {"error": "No entities found"}
        
    entity, author_name = random.choice(results)
    
    game_data = await generate_mystery_game(entity.title, author_name, entity.description)
    return game_data

from ai_service import generate_quote_game

@app.post("/api/game/quote")
async def get_quote_game(session: Session = Depends(get_session)):
    # Get all entities with authors
    statement = select(Entity, Author.name).join(Author, Entity.author_id == Author.id)
    results = session.exec(statement).all()
    
    if not results:
        return {"error": "No entities found"}
    
    # Try up to 5 times to find a valid quote
    for _ in range(5):
        entity, author_name = random.choice(results)
        game_data = await generate_quote_game(entity.title, author_name)
        
        if game_data.get("valid"):
            # Add metadata for frontend display
            game_data["title"] = entity.title
            game_data["author"] = author_name
            return game_data
            
    return {"error": "Could not find a major work with quotes after 5 attempts. Try adding more famous works!"}


