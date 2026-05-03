import os
import json
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from typing import List, Optional
from groq import AsyncGroq
from database.db import get_db
from models.models import Session, Message, User
from routes.auth import decode_token

router = APIRouter()

# ── Richer system prompts ────────────────────────────────────────────────────
SYSTEM_PROMPTS = {
    "assistant": (
        "You are EduLens AI — a highly capable, friendly, and intellectually curious AI assistant. "
        "You give clear, accurate, and thoughtful responses. "
        "When answering, be concise but complete. Use markdown formatting (headers, lists, code blocks) "
        "when it helps clarity. Always be honest — say 'I don't know' rather than guessing. "
        "Anticipate follow-up questions and proactively cover them when helpful."
    ),
    "coder": (
        "You are EduLens Coder — a senior software engineer with deep expertise across languages and paradigms. "
        "Write production-quality code with clear variable names, helpful comments, and proper error handling. "
        "Always use markdown code blocks with the correct language tag. "
        "When reviewing code, point out bugs, performance issues, and security vulnerabilities. "
        "Prefer modern best practices. Explain trade-offs when multiple approaches exist. "
        "If a question is ambiguous, state your assumption before answering."
    ),
    "teacher": (
        "You are EduLens Teacher — a patient, engaging, and world-class educator. "
        "Your superpower is making complex ideas crystal clear through analogies, real-world examples, "
        "and step-by-step explanations. Always gauge the student's level from their question and adapt accordingly. "
        "Use the Socratic method when helpful — ask guiding questions rather than just giving answers. "
        "Celebrate progress. Break large concepts into digestible chunks. "
        "End explanations with a quick comprehension check or a thought-provoking question."
    ),
    "writer": (
        "You are EduLens Writer — a creative writing partner with a sharp editorial eye. "
        "You help users craft compelling narratives, refine prose, overcome writer's block, and find their voice. "
        "When reviewing writing, lead with strengths before suggesting improvements. "
        "Offer multiple versions or alternatives when rewriting. "
        "Be attuned to tone, rhythm, and reader experience. "
        "Draw on literature, storytelling theory, and genre conventions to elevate the work."
    ),
    "analyst": (
        "You are EduLens Analyst — a rigorous data analyst and strategic thinker. "
        "You excel at breaking down complex problems, identifying patterns, and delivering structured insights. "
        "Always organize your analysis clearly: context → findings → implications → recommendations. "
        "Use frameworks (SWOT, Porter's Five Forces, etc.) when appropriate and explain your reasoning. "
        "Be data-driven; flag when you're speculating vs. drawing on established facts. "
        "Present information visually using tables and bullet points for scannability."
    ),
}


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: DBSession = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    uid  = decode_token(authorization[7:])
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class ImageInput(BaseModel):
    data_url:   str
    media_type: str


class ChatRequest(BaseModel):
    session_id: str
    message:    str
    model:      str = "llama-3.1-8b-instant"
    images:     Optional[List[ImageInput]] = []


@router.post("/chat/stream")
async def chat_stream(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    session = db.query(Session).filter(
        Session.id == req.session_id, Session.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Save user message (including any attached images as JSON)
    import json as _json
    images_data = None
    if req.images:
        images_data = _json.dumps([{"data_url": img.data_url, "media_type": img.media_type} for img in req.images])
    user_msg = Message(session_id=session.id, role="user", content=req.message, images_json=images_data)
    db.add(user_msg)
    db.commit()

    # Auto-title session on first message
    all_msgs = db.query(Message).filter(Message.session_id == session.id).all()
    if len(all_msgs) <= 1:
        title = req.message[:55] + ("…" if len(req.message) > 55 else "")
        session.title = title
        db.commit()

    history = [
        {"role": m.role, "content": m.content}
        for m in db.query(Message)
            .filter(Message.session_id == session.id)
            .order_by(Message.created_at)
            .all()
    ]

    system_text = SYSTEM_PROMPTS.get(session.system_prompt, SYSTEM_PROMPTS["assistant"])
    session_id  = session.id
    model       = req.model
    req_images  = req.images or []

    async def generate():
        import asyncio
        client        = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
        full_response = ""
        total_tokens  = 0

        try:
            yield ": keepalive\n\n"

            def to_str(c):
                return c if isinstance(c, str) else str(c)

            safe_history = [
                {"role": m["role"], "content": to_str(m["content"])}
                for m in history
            ]

            if req_images:
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
                    + safe_history[:-1]
                    + [{"role": "user", "content": user_content}]
                )
            else:
                messages_to_send = (
                    [{"role": "system", "content": system_text}]
                    + safe_history
                )

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
                if hasattr(chunk, "usage") and chunk.usage:
                    total_tokens = chunk.usage.total_tokens
                now = asyncio.get_event_loop().time()
                if now - last_ping > 15:
                    yield ": keepalive\n\n"
                    last_ping = now

            # Persist assistant reply
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
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/chat/{session_id}/messages")
def get_messages(
    session_id: str,
    user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    session = db.query(Session).filter(
        Session.id == session_id, Session.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .all()
    )
    import json as _json
    def parse_images(images_json):
        if not images_json:
            return []
        try:
            return _json.loads(images_json)
        except Exception:
            return []

    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "token_count": m.token_count,
            "created_at": m.created_at.isoformat(),
            "images": parse_images(m.images_json),
        }
        for m in messages
    ]


@router.get("/chat/{session_id}/export")
def export_chat(
    session_id: str,
    user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    session = db.query(Session).filter(
        Session.id == session_id, Session.user_id == user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at)
        .all()
    )
    return {
        "session": {
            "id": session.id,
            "title": session.title,
            "system_prompt": session.system_prompt,
            "created_at": session.created_at.isoformat(),
        },
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "token_count": m.token_count,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
        "exported_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "model_info": "EduLens AI — powered by Groq",
    }
