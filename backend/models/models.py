from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email       = Column(String, unique=True, nullable=False, index=True)
    name        = Column(String, default="")
    avatar_url  = Column(String, default="")
    provider    = Column(String, default="email")   # "email" | "google"
    password_hash = Column(String, nullable=True)   # None for OAuth users
    theme       = Column(String, default="dark")    # "dark" | "light" | "midnight" | "ocean"
    created_at  = Column(DateTime, default=datetime.utcnow)
    sessions    = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id       = Column(String, ForeignKey("users.id"), nullable=True)
    title         = Column(String, default="New Chat")
    system_prompt = Column(String, default="assistant")
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages      = relationship("Message", back_populates="session",
                                 cascade="all, delete-orphan", order_by="Message.created_at")
    user          = relationship("User", back_populates="sessions")

class Message(Base):
    __tablename__ = "messages"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    session_id  = Column(String, ForeignKey("sessions.id"), nullable=False)
    role        = Column(String, nullable=False)
    content     = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    images_json = Column(Text, nullable=True, default=None)  # JSON array of {data_url, media_type, name}
    created_at  = Column(DateTime, default=datetime.utcnow)
    session     = relationship("Session", back_populates="messages")
