from typing import Optional
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship
from datetime import date

class EntityType(str, Enum):
    WORK = "WORK"
    EVENT = "EVENT"

class Author(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    bio: Optional[str] = None

class Entity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: EntityType
    title: str
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    description: str
    author_id: Optional[int] = Field(default=None, foreign_key="author.id")
    tags: str  # Comma-separated tags
    timeline: str = Field(default="General")
