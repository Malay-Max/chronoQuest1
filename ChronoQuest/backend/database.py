from sqlmodel import SQLModel, create_engine, Session

import os

sqlite_file_name = "data/chrono.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Ensure data directory exists
os.makedirs(os.path.dirname(sqlite_file_name), exist_ok=True)

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
