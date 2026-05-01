import os
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Header
from typing import Optional
from groq import AsyncGroq
from routes.auth import decode_token

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
):
    """
    Transcribe audio using Groq's Whisper API.
    Accepts any audio format the browser MediaRecorder produces (webm, ogg, mp4).
    Auth is optional — unauthenticated users can still use voice input.
    """
    # Optionally validate token if provided (don't block unauthenticated use)
    # if authorization and authorization.startswith("Bearer "):
    #     decode_token(authorization[7:])  # raises 401 if invalid

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Transcription service not configured")

    audio_bytes = await file.read()
    if len(audio_bytes) < 1000:
        # Too short — likely silence or empty recording
        return {"text": ""}

    client = AsyncGroq(api_key=api_key)

    try:
        # Groq Whisper accepts webm, mp4, ogg, wav, flac, m4a
        filename = file.filename or "audio.webm"
        transcription = await client.audio.transcriptions.create(
            file=(filename, audio_bytes, file.content_type or "audio/webm"),
            model="whisper-large-v3-turbo",  # fastest Groq Whisper model
            response_format="text",
            language="en",
        )
        # When response_format="text", the result is a plain string
        text = transcription if isinstance(transcription, str) else getattr(transcription, "text", "")
        return {"text": text.strip()}

    except Exception as e:
        error_msg = str(e)
        print(f"Transcription error: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {error_msg}")
