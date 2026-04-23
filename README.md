# ⚡ EduLens—AI at the Speed of Thought

A production-ready AI chatbot powered by **Groq API** (LLaMA3 / Mixtral) with real-time streaming, glassmorphism UI, multi-session management, and voice input.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React)                   │
│  ┌──────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ Sidebar  │  │  Chat Window  │  │  ChatInput  │  │
│  │(Sessions)│  │  (Messages)   │  │(Voice/Send) │  │
│  └──────────┘  └───────────────┘  └─────────────┘  │
│          Zustand State  │  SSE Stream               │
└──────────────────────────────────────────────────── ┘
                          │ HTTP/SSE
┌─────────────────────────▼───────────────────────────┐
│               FastAPI Backend (Python)               │
│  ┌──────────────┐        ┌───────────────────────┐  │
│  │  /sessions   │        │    /chat/stream        │  │
│  │  CRUD ops    │        │  SSE token streaming   │  │
│  └──────┬───────┘        └──────────┬────────────┘  │
│         │                           │               │
│  ┌──────▼───────────────────────────▼────────────┐  │
│  │              SQLAlchemy + SQLite               │  │
│  └────────────────────────────────────────────────┘  │
│                           │                          │
│  ┌────────────────────────▼───────────────────────┐  │
│  │                  Groq Python SDK               │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                           │
                    Groq Cloud API
                 (LLaMA3 / Mixtral / Gemma)
```

---

## Features

- ⚡ **Real-time streaming** — token-by-token via Server-Sent Events
- 💬 **Multi-session** — create, rename, delete chat sessions
- 🧠 **Conversation memory** — full history sent on each request
- 🎨 **Glassmorphism UI** — dark mode, blur effects, Framer Motion animations
- 🎤 **Voice input** — Web Speech API (Chrome/Edge)
- 📝 **Markdown + syntax highlighting** — code blocks, tables, lists
- 🤖 **Persona selector** — Assistant, Coder, Teacher, Writer, Analyst
- 📊 **Token usage** — displayed per message and in header
- 📋 **Copy response** — one-click copy for any message
- 💾 **Export chat** — download session as JSON
- 🔄 **Model switcher** — LLaMA3 8B/70B, Mixtral, Gemma2

---

## Setup

### 1. Get a Groq API Key
Sign up at [console.groq.com](https://console.groq.com) and create an API key.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your GROQ_API_KEY

uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
groq-chat/
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── chat.py              # /chat/stream, /chat/{id}/messages
│   │   └── sessions.py          # CRUD for sessions
│   ├── models/
│   │   └── models.py            # SQLAlchemy Session + Message
│   └── database/
│       └── db.py                # Engine, SessionLocal, init_db
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx              # Root layout + welcome screen
        ├── main.jsx
        ├── store/
        │   └── chatStore.js     # Zustand global state
        ├── pages/
        │   └── ChatPage.jsx     # Main chat view
        ├── hooks/
        │   └── useVoiceInput.js # Web Speech API hook
        ├── utils/
        │   └── api.js           # Axios instance
        ├── styles/
        │   └── globals.css      # Tailwind + custom styles
        └── components/
            ├── sidebar/
            │   └── Sidebar.jsx
            └── chat/
                ├── ChatHeader.jsx
                ├── ChatInput.jsx
                ├── MessageBubble.jsx
                ├── StreamingBubble.jsx
                └── TypingIndicator.jsx
```

---

## Environment Variables

```env
# backend/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

---

## Available Models

| Model | Context | Best For |
|-------|---------|----------|
| llama3-8b-8192 | 8K | Fast, everyday tasks |
| llama3-70b-8192 | 8K | High quality responses |
| mixtral-8x7b-32768 | 32K | Long context tasks |
| gemma2-9b-it | 8K | Efficient reasoning |

---

## Screenshots

```
[Welcome Screen]  — Persona selector cards with glassmorphism cards
[Chat View]       — Message bubbles, streaming cursor, syntax highlighted code
[Sidebar]         — Collapsible, session list with rename/delete, model switcher
[Voice Input]     — Animated mic button with red pulse when recording
```
