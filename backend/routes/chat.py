import os
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from typing import List, Optional
from groq import AsyncGroq
from database.db import get_db
from models.models import Session, Message

router = APIRouter()

SYSTEM_PROMPTS = {
    "assistant": "You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and concise responses.",
    "coder": "You are an expert software engineer. Provide clean, well-commented code with explanations. Use best practices and modern patterns. Format code in markdown code blocks.",
    "teacher": "You are a patient and encouraging teacher. Explain concepts clearly with examples, analogies, and step-by-step breakdowns. Adapt to the student's level.",
    "writer": "You are a creative writing assistant. Help craft compelling narratives, refine prose, and suggest improvements. Be imaginative and literary.",
    "analyst": "You are a data analyst and business strategist. Provide structured analysis, insights, and data-driven recommendations.",
}

class ImageInput(BaseModel):
    data_url: str
    media_type: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    model: str = "llama-3.1-8b-instant"
    images: Optional[List[ImageInput]] = []  # ✅ Accept images field from frontend

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_msg = Message(session_id=session.id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    all_msgs = db.query(Message).filter(Message.session_id == session.id).all()
    if len(all_msgs) <= 1:
        title = req.message[:50] + ("..." if len(req.message) > 50 else "")
        session.title = title
        db.commit()

    # Build history — all previous messages as plain text
    history = [
        {"role": m.role, "content": m.content}
        for m in db.query(Message).filter(Message.session_id == session.id).order_by(Message.created_at).all()
    ]

    system_text = SYSTEM_PROMPTS.get(session.system_prompt, SYSTEM_PROMPTS["assistant"])
    session_id = session.id
    model = req.model
    # Capture images now while we still have the request object
    req_images = req.images or []

    async def generate():
        import asyncio
        client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
        full_response = ""
        total_tokens = 0

        try:
            yield ": keepalive\n\n"

            # Groq rule: ALL history entries must have string content.
            # Only the CURRENT (last) user message can be a list (for vision).
            def to_str(c):
                return c if isinstance(c, str) else str(c)

            safe_history = [{"role": m["role"], "content": to_str(m["content"])} for m in history]

            if req_images:
                # Current user turn: build multimodal content list
                user_content = [
                    {"type": "text", "text": safe_history[-1]["content"] or "Describe this image."}
                ]
                for img in req_images:
                    user_content.append({
                        "type": "image_url",
                        "image_url": {"url": img.data_url}
                    })
                messages_to_send = (
                    [{"role": "system", "content": system_text}]
                    + safe_history[:-1]          # prior turns — all plain strings
                    + [{"role": "user", "content": user_content}]   # current turn with images
                )
            else:
                messages_to_send = [{"role": "system", "content": system_text}] + safe_history

            stream = await client.chat.completions.create(
                model=model,
                messages=messages_to_send,
                stream=True,
                max_tokens=4096,
            )

            last_ping = asyncio.get_event_loop().time()
            async for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    full_response += delta
                    yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"

                if hasattr(chunk, 'usage') and chunk.usage:
                    total_tokens = chunk.usage.total_tokens

                # Send a keepalive ping every 15 seconds between chunks
                now = asyncio.get_event_loop().time()
                if now - last_ping > 15:
                    yield ": keepalive\n\n"
                    last_ping = now

            from database.db import SessionLocal
            save_db = SessionLocal()
            try:
                asst_msg = Message(
                    session_id=session_id,
                    role="assistant",
                    content=full_response,
                    token_count=total_tokens,
                )
                save_db.add(asst_msg)
                save_db.commit()
                save_db.refresh(asst_msg)
                msg_id = asst_msg.id
            finally:
                save_db.close()

            yield f"data: {json.dumps({'type': 'done', 'tokens': total_tokens, 'message_id': msg_id})}\n\n"

        except Exception as e:
            error_msg = str(e)
            print(f"Groq error: {error_msg}")
            yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


@router.get("/chat/{session_id}/messages")
def get_messages(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "token_count": m.token_count,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


@router.get("/chat/{session_id}/export")
def export_chat(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at).all()
    return {
        "session": {
            "id": session.id,
            "title": session.title,
            "system_prompt": session.system_prompt,
            "created_at": session.created_at.isoformat()
        },
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
            for m in messages
        ],
    }
