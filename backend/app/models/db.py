from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    password_hash = Column(String, nullable=True) # Nullable for third-party auth
    # google_subject = Column(String, unique=True, index=True, nullable=True)  # Deprecated
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    scans = relationship("ScanHistory", back_populates="owner")

class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True) # Nullable for migration purposes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    input_type = Column(String)
    original_text = Column(String)
    trust_score = Column(Integer)
    verdict = Column(String)
    category = Column(String)
    language = Column(String)
    explanation = Column(String)
    highlights = Column(String) # JSON string
    advice = Column(String) # JSON string
    entities = Column(String) # JSON string
    breakdown = Column(String) # JSON string

    owner = relationship("User", back_populates="scans")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
