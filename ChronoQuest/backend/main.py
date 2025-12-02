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

@app.get("/api/timeline", response_model=List[Entity])
def get_timeline(session: Session = Depends(get_session)):
    entities = session.exec(select(Entity).order_by(Entity.date_start)).all()
    return entities

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
    # Save authors
    for author in data.authors:
        session.add(author)
    
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
                
        entity = Entity(
            type=entity_data.type,
            title=entity_data.title,
            date_start=date_start_obj,
            date_end=date_end_obj,
            description=entity_data.description,
            author_id=entity_data.author_id,
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


