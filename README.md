<div align="center">

# ⚡ EduLens AI

### AI at the Speed of Thought

A production-ready AI chatbot with authentication, persistent chat history, Google OAuth, and theme switching — powered by the Groq API with real-time streaming and a glassmorphism UI.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-edulensai7.netlify.app-8b5cf6?style=for-the-badge&logo=netlify&logoColor=white)](https://edulensai7.netlify.app)
[![Backend](https://img.shields.io/badge/API-Render-06b6d4?style=for-the-badge&logo=render&logoColor=white)](https://edulens-ai-1.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## ✨ Features

### 🤖 AI & Chat
- **Real-time streaming** — token-by-token responses via Server-Sent Events (SSE) with keepalive pings
- **5 AI personas** — Assistant, Coder, Teacher, Writer, Analyst — each with a tailored system prompt
- **3 Groq models** — LLaMA 3.1 8B (fast), LLaMA 3.3 70B (smart), Llama 4 Scout (vision)
- **Full conversation memory** — complete history sent on every request, nothing lost
- **Image / vision input** — attach images for analysis with Llama 4 Scout
- **Voice input** — record audio in-browser; transcribed server-side with Groq Whisper (`whisper-large-v3-turbo`)
- **Auto-titling** — sessions named automatically from the first message (up to 55 chars)
- **Markdown + syntax highlighting** — code blocks, tables, and lists rendered beautifully
- **Copy & export** — one-click copy per message; download any session as JSON
- **Token usage** — displayed per message and in the header

### 🔐 Auth & Users
- **JWT authentication** — 30-day tokens, bcrypt-hashed passwords
- **Google OAuth 2.0** — one-click sign-in with Google
- **Email / password** — classic register and login
- **Persistent chat history** — every conversation saved per user in SQLite, restored on login
- **Instant session restore** — stays logged in on page refresh via localStorage cache
- **Server-side theme** — appearance preference synced across devices
- **Profile editing** — update display name at any time

### 🎨 UI & Experience
- **Landing page** — Hero, Features, Pricing, About, FAQ, and Contact sections
- **4 themes** — Dark, Midnight, Ocean, Light — switchable from the profile menu
- **Multi-session management** — create, rename, and delete chat sessions
- **Collapsible sidebar** — session list, model switcher, export, profile strip
- **Fully responsive** — mobile drawer sidebar, desktop persistent layout
- **Glassmorphism UI** — dark mode, blur effects, Framer Motion animations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React)                        │
│                                                             │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │   Sidebar   │  │  Chat Window  │  │    ChatInput     │   │
│  │ (Sessions)  │  │  (Messages)   │  │ (Voice / Send)   │   │
│  └─────────────┘  └───────────────┘  └──────────────────┘   │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────────────────┐    │
│  │  AuthContext     │   │       Zustand Store          │    │
│  │  (JWT + Cache)   │   │   (Sessions / Messages)      │    │
│  └──────────────────┘   └──────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────▼──────────────────────────────┐
│                  FastAPI Backend (Python)                   │
│                                                             │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  /auth/*   │  │  /sessions   │  │   /chat/stream      │  │
│  │ JWT + OAuth│  │  CRUD (auth) │  │   SSE streaming     │  │
│  └────────────┘  └──────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              /transcribe  (Groq Whisper)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│         ┌─────────────────────────────────────┐             │
│         │    SQLAlchemy + SQLite              │             │
│         │    Users · Sessions · Messages      │             │
│         └──────────────────┬──────────────────┘             │
│                            │                                │
│         ┌──────────────────▼──────────────────┐             │
│         │         Groq Python SDK             │             │
│         └─────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
                             │
                        Groq Cloud API
          (LLaMA 3.1 8B · LLaMA 3.3 70B · Llama 4 Scout)
          (Whisper Large v3 Turbo — audio transcription)
```

---

## 🧠 Models & Themes

### Available Models

| Model | Speed | Best For |
|---|---|---|
| `llama-3.1-8b-instant` | ⚡ Fast | Everyday tasks, quick answers |
| `llama-3.3-70b-versatile` | 🧠 Smart | Complex reasoning, nuanced responses |
| `llama-4-scout-17b-16e-instruct` | 👁️ Vision | Image understanding + analysis |

Audio transcription uses `whisper-large-v3-turbo` (fastest Groq Whisper model).

### Themes

| Theme | Background | Accent |
|---|---|---|
| 🌑 Dark *(default)* | `#080810` | Violet |
| 🌃 Midnight | `#000008` | Blue |
| 🌊 Ocean | `#020c14` | Cyan |
| ☀️ Light | `#f8fafc` | Violet |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Zustand, Framer Motion, Tailwind CSS, Axios, Lucide React, React Router v6, React Markdown, React Syntax Highlighter |
| **Backend** | FastAPI 0.111, SQLAlchemy 2, SQLite, Groq SDK, Python-Jose, Passlib, HTTPX, Uvicorn |
| **Auth** | JWT (HS256, 30-day), Google OAuth 2.0, bcrypt |
| **AI** | Groq Cloud — LLaMA 3.1 8B, LLaMA 3.3 70B, Llama 4 Scout, Whisper Large v3 Turbo |
| **Deployment** | Netlify (frontend), Render (backend) |

---

## 📁 Project Structure

```
EduLens_AI/
├── backend/
│   ├── main.py                   # FastAPI app, CORS, router registration
│   ├── requirements.txt
│   ├── Procfile                  # Render start command
│   ├── routes/
│   │   ├── auth.py               # Register, login, Google OAuth, theme, profile
│   │   ├── chat.py               # SSE streaming, message history, JSON export
│   │   ├── sessions.py           # Session CRUD (per-user, auth-scoped)
│   │   └── transcribe.py         # Audio → text via Groq Whisper
│   ├── models/
│   │   └── models.py             # User, Session, Message (SQLAlchemy ORM)
│   └── database/
│       └── db.py                 # Engine, SessionLocal, init_db
│
└── frontend/
    └── src/
        ├── App.jsx               # Root layout, view routing, view persistence
        ├── context/
        │   └── AuthContext.jsx   # JWT auth, Google OAuth, theme, localStorage cache
        ├── store/
        │   └── chatStore.js      # Zustand — sessions + messages state
        ├── pages/
        │   ├── LandingPage.jsx   # Marketing site (Hero, Features, Pricing, FAQ…)
        │   └── ChatPage.jsx      # Main chat interface
        ├── hooks/
        │   └── useVoiceInput.js  # MediaRecorder → /api/transcribe
        └── components/
            ├── auth/
            │   ├── AuthModal.jsx        # Login / register / Google OAuth modal
            │   └── ProfileDropdown.jsx  # Theme picker, profile edit, sign out
            ├── sidebar/
            │   └── Sidebar.jsx          # Session list, persona/model switcher
            ├── landing/
            │   ├── CosmicBackground.jsx # Animated landing background
            │   ├── GooeyNav.jsx         # Gooey navigation bar
            │   └── GooeyNav.css
            └── chat/
                ├── ChatHeader.jsx       # Model selector, token count, title
                ├── ChatInput.jsx        # Text input, image upload, voice record
                ├── MessageBubble.jsx    # Markdown renderer, copy, image display
                ├── StreamingBubble.jsx  # Live-updating bubble during SSE stream
                └── TypingIndicator.jsx  # Animated dots while awaiting first token
```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2025 EduLens AI
