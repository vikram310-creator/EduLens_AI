import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database.db import init_db
from routes.chat import router as chat_router
from routes.sessions import router as sessions_router

load_dotenv()

app = FastAPI(title="GroqChat API", version="1.0.0")

# FIX: Don't mix wildcard pattern strings in allow_origins — use allow_origin_regex only.
# Mixing "https://*.netlify.app" (glob, not supported) with allow_credentials=True
# causes browsers to reject CORS preflight responses.
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://edulens-ai.netlify.app",
    "https://edulens-ai0.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.netlify\.app",  # handles all *.netlify.app
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/health")
async def health():
    return {"status": "ok"}
