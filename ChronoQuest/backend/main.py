from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from contextlib import asynccontextmanager
from typing import List

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

class CommitRequest(BaseModel):
    authors: List[Author]
    entities: List[Entity]

@app.post("/api/commit")
def commit_data(data: CommitRequest, session: Session = Depends(get_session)):
    # Save authors first to get IDs (simplified logic)
    # In a real app, we'd need to handle deduplication and mapping
    
    for author in data.authors:
        session.add(author)
    
    # We might need to commit here to get IDs if we were linking strictly, 
    # but for this MVP we'll just save everything.
    # Note: The frontend should ideally handle linking author_ids if possible, 
    # or we just save them independently for now.
    
    for entity in data.entities:
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


