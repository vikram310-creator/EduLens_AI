# ⚡ EduLens_AI — AI at the Speed of Thought

A production-ready AI chatbot with **authentication**, **persistent chat history**, **Google OAuth**, and **theme switching** — powered by Groq API with real-time streaming, glassmorphism UI, and multi-session management.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-edulens--ai0.netlify.app-8b5cf6?style=flat-square&logo=netlify)](https://edulensai7.netlify.app)
[![Backend](https://img.shields.io/badge/API-Render-06b6d4?style=flat-square&logo=render)](https://edulens-ai-1.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](LICENSE)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React)                        │
│                                                             │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │   Sidebar   │  │  Chat Window  │  │    ChatInput     │  │
│  │ (Sessions)  │  │  (Messages)   │  │ (Voice / Send)   │  │
│  └─────────────┘  └───────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────────────────┐   │
│  │  AuthContext     │   │       Zustand Store          │   │
│  │  (JWT + Cache)   │   │   (Sessions / Messages)      │   │
│  └──────────────────┘   └──────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────▼──────────────────────────────┐
│                  FastAPI Backend (Python)                    │
│                                                             │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  /auth/*   │  │  /sessions   │  │   /chat/stream      │ │
│  │ JWT + OAuth│  │  CRUD (auth) │  │   SSE streaming     │ │
│  └────────────┘  └──────────────┘  └─────────────────────┘ │
│                                                             │
│         ┌─────────────────────────────────────┐            │
│         │       SQLAlchemy + SQLite            │            │
│         │   Users · Sessions · Messages        │            │
│         └──────────────────┬──────────────────┘            │
│                            │                               │
│         ┌──────────────────▼──────────────────┐            │
│         │           Groq Python SDK            │            │
│         └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                             │
                        Groq Cloud API
                (LLaMA 3.1 / 3.3 70B / Llama 4 Scout)
```

---

## Features

### 🤖 AI & Chat
- **Real-time streaming** — token-by-token response via Server-Sent Events
- **5 AI personas** — Assistant, Coder, Teacher, Writer, Analyst — each tuned for its purpose
- **3 models** — LLaMA 3.1 8B (fast), LLaMA 3.3 70B (smart), Llama 4 Scout (vision)
- **Conversation memory** — full history sent on every request, nothing lost
- **Image / vision input** — upload images with Llama 4 Scout
- **Voice input** — Web Speech API (Chrome / Edge)
- **Markdown + syntax highlighting** — code blocks, tables, lists rendered beautifully
- **Copy response** — one-click copy for any message
- **Export chat** — download any session as JSON
- **Token usage** — displayed per message and in the header

### 🔐 Auth & Users
- **JWT authentication** — 30-day tokens, bcrypt-hashed passwords
- **Google OAuth** — one-click sign-in with Google
- **Email / password** — classic register and login
- **Persistent chat history** — every conversation saved per user, restored on login
- **Instant session restore** — user stays logged in on page refresh via localStorage cache
- **Theme saved to server** — appearance preference follows you across devices

### 🎨 UI & Experience
- **Landing page** — Hero, Features, Pricing, About, FAQ, and Contact sections
- **4 themes** — Dark, Midnight, Ocean, Light — switchable from the profile menu
- **Multi-session management** — create, rename, delete chat sessions
- **Collapsible sidebar** — session list, model switcher, export, profile strip
- **Fully responsive** — mobile drawer sidebar, desktop persistent layout
- **Glassmorphism UI** — dark mode, blur effects, Framer Motion animations
- **Profile dropdown** — avatar, email, provider badge, theme picker, sign out

---

## Available Models

| Model | Speed | Best For |
|---|---|---|
| `llama-3.1-8b-instant` | ⚡ Fast | Everyday tasks, quick answers |
| `llama-3.3-70b-versatile` | 🧠 Smart | Complex reasoning, nuanced responses |
| `llama-4-scout-17b-16e-instruct` | 👁️ Vision | Image understanding + analysis |

---

## Themes

| Theme | Background | Accent |
|---|---|---|
| 🌑 Dark | `#080810` | Violet |
| 🌃 Midnight | `#000008` | Blue |
| 🌊 Ocean | `#020c14` | Cyan |
| ☀️ Light | `#f5f5f8` | Violet |

---

## Tech Stack

**Frontend** — React 18 · Vite · Zustand · Framer Motion · Tailwind CSS · Axios · Lucide React

**Backend** — FastAPI · SQLAlchemy · SQLite · Groq SDK · Python-Jose · Passlib · HTTPX

**Auth** — JWT (30-day) · Google OAuth 2.0 · bcrypt

**AI** — Groq Cloud API — LLaMA 3.1, LLaMA 3.3 70B, Llama 4 Scout

---

## Project Structure

```
EduLens_AI/
├── backend/
│   ├── main.py                   # FastAPI app entry point
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py               # Register, login, Google OAuth, theme
│   │   ├── chat.py               # SSE streaming, message history, export
│   │   └── sessions.py           # Session CRUD (per-user, auth-scoped)
│   ├── models/
│   │   └── models.py             # User, Session, Message (SQLAlchemy)
│   └── database/
│       └── db.py                 # Engine, SessionLocal, init_db
│
└── frontend/
    └── src/
        ├── App.jsx               # Root layout + landing/app view routing
        ├── context/
        │   └── AuthContext.jsx   # JWT auth, Google OAuth, theme, cache
        ├── store/
        │   └── chatStore.js      # Zustand — sessions + messages
        ├── pages/
        │   ├── LandingPage.jsx   # Marketing site
        │   └── ChatPage.jsx      # Main chat view
        ├── hooks/
        │   └── useVoiceInput.js  # Web Speech API
        └── components/
            ├── auth/
            │   ├── AuthModal.jsx        # Login / register modal
            │   └── ProfileDropdown.jsx  # Theme picker + sign out
            ├── sidebar/
            │   └── Sidebar.jsx
            └── chat/
                ├── ChatHeader.jsx
                ├── ChatInput.jsx
                ├── MessageBubble.jsx
                └── StreamingBubble.jsx
```

---

## License

MIT © 2025 EduLens AI
