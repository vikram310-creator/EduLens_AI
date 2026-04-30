from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from database.db import get_db
from models.models import Session, Message, User
from routes.auth import decode_token
from typing import Optional
import uuid

router = APIRouter()

def get_current_user(authorization: Optional[str] = Header(None), db: DBSession = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    uid = decode_token(authorization[7:])
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_optional_user(authorization: Optional[str] = Header(None), db: DBSession = Depends(get_db)) -> Optional[User]:
    """Returns None instead of 401 — graceful degradation for unauthenticated requests."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        uid = decode_token(authorization[7:])
        return db.query(User).filter(User.id == uid).first()
    except Exception:
        return None

class CreateSession(BaseModel):
    system_prompt: str = "assistant"

class RenameSession(BaseModel):
    title: str

@router.get("/sessions")
def list_sessions(user: Optional[User] = Depends(get_optional_user), db: DBSession = Depends(get_db)):
    """Returns [] for unauthenticated requests so old frontends don't get 401 spam."""
    if not user:
        return []
    sessions = db.query(Session).filter(Session.user_id == user.id).order_by(Session.updated_at.desc()).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "system_prompt": s.system_prompt,
            "message_count": len(s.messages),
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        }
        for s in sessions
    ]

@router.post("/sessions")
def create_session(body: CreateSession, user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    session = Session(id=str(uuid.uuid4()), user_id=user.id, system_prompt=body.system_prompt)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "system_prompt": session.system_prompt, "created_at": session.created_at.isoformat()}

@router.patch("/sessions/{session_id}")
def rename_session(session_id: str, body: RenameSession, user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id, Session.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = body.title
    db.commit()
    return {"id": session.id, "title": session.title}

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, user: User = Depends(get_current_user), db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id, Session.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}
