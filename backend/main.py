import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database.db import init_db
from routes.chat import router as chat_router
from routes.sessions import router as sessions_router

load_dotenv()

app = FastAPI(title="Groq Chat API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # 🔥 TEMP FIX (for debugging)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "EduLens AI backend running 🚀"}

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/health")
async def health():
    return {"status": "ok"}
