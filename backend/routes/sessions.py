from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from database.db import get_db
from models.models import Session, Message
import uuid

router = APIRouter()

class CreateSession(BaseModel):
    system_prompt: str = "assistant"

class RenameSession(BaseModel):
    title: str

@router.get("/sessions")
def list_sessions(db: DBSession = Depends(get_db)):
    sessions = db.query(Session).order_by(Session.updated_at.desc()).all()
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
def create_session(body: CreateSession, db: DBSession = Depends(get_db)):
    session = Session(id=str(uuid.uuid4()), system_prompt=body.system_prompt)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "system_prompt": session.system_prompt, "created_at": session.created_at.isoformat()}

@router.patch("/sessions/{session_id}")
def rename_session(session_id: str, body: RenameSession, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.title = body.title
    db.commit()
    return {"id": session.id, "title": session.title}

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True}
