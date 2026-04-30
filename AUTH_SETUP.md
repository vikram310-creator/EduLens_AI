# EduLens AI — Auth Setup Guide

This document covers everything you need to add auth, persistent chat history, Google sign-in, and theme switching to your existing EduLens AI deployment.

---

## What was added

| Area | Change |
|---|---|
| **Backend** | `User` model, JWT auth, email/password register & login, Google OAuth, theme + profile endpoints |
| **Sessions** | All session/chat routes now scoped per user (auth required) |
| **Frontend** | `AuthContext`, `AuthModal` (login/register/Google), `ProfileDropdown` (theme picker, sign-out), sidebar user strip |
| **Themes** | Dark, Midnight, Ocean, Light — saved to server, applied on login |
| **Chat gate** | Typing and hitting Enter shows the auth modal if not signed in |

---

## 1. Backend — new dependencies

```bash
cd backend
pip install passlib[bcrypt] python-jose[cryptography]
# or update requirements.txt and redeploy to Render
```

The new `requirements.txt` already includes these.

---

## 2. Backend — environment variables

Copy `.env.example` to `.env` and fill in:

```
GROQ_API_KEY=...          # already set
JWT_SECRET=...            # generate: python -c "import secrets; print(secrets.token_hex(32))"
GOOGLE_CLIENT_ID=...      # from Google Cloud Console (optional)
GOOGLE_CLIENT_SECRET=...  # from Google Cloud Console (optional)
GOOGLE_REDIRECT_URI=...   # your frontend URL + /auth/google/callback
```

On **Render**, add these in the Environment tab of your service.

---

## 3. Google OAuth setup (optional but recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project (or use existing)
3. Enable the **Google+ API** or **People API**
4. Create **OAuth 2.0 Client ID** → Web application
5. Add **Authorised redirect URIs**:
   - `http://localhost:5173/auth/google/callback` (dev)
   - `https://your-app.netlify.app/auth/google/callback` (prod)
6. Copy Client ID and Secret to your backend `.env`

> If you skip Google OAuth, email/password login still works perfectly.

---

## 4. Database migration

The new schema adds a `users` table and a `user_id` column to `sessions`.

**Option A — Fresh start (recommended for dev):** Delete `groqchat.db` and let `init_db()` recreate it on startup.

**Option B — Migrate existing data:** Run this once before deploying:

```python
# migrate.py — run from backend/ directory
from database.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Add users table (init_db handles this)
    # Add user_id to existing sessions (nullable, so old rows stay)
    try:
        conn.execute(text("ALTER TABLE sessions ADD COLUMN user_id VARCHAR REFERENCES users(id)"))
        conn.commit()
        print("Migration complete")
    except Exception as e:
        print(f"Already migrated or error: {e}")
```

---

## 5. Frontend — no new packages needed

All auth UI uses existing deps (framer-motion, lucide-react, axios, zustand).

---

## 6. Deploy

### Render (backend)
- Push changes, Render auto-deploys
- Add `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in Environment tab
- The disk is ephemeral — consider upgrading to PostgreSQL for production:
  ```
  DATABASE_URL=postgresql://user:pass@host/db
  ```
  Then change `db.py` to use `create_engine(os.environ["DATABASE_URL"])`.

### Netlify (frontend)
- Push changes, Netlify auto-deploys
- No new env vars needed on the frontend side

---

## 7. New API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Email/password register |
| POST | `/api/auth/login` | No | Email/password login |
| GET | `/api/auth/google/url` | No | Get Google OAuth redirect URL |
| POST | `/api/auth/google/callback` | No | Exchange code for JWT |
| GET | `/api/auth/me` | Bearer | Get current user |
| PATCH | `/api/auth/theme` | Bearer | Update theme preference |
| PATCH | `/api/auth/profile` | Bearer | Update display name |

All existing `/api/sessions` and `/api/chat` endpoints now require `Authorization: Bearer <token>`.

---

## 8. Themes

| Theme | Background | Accent |
|---|---|---|
| Dark (default) | `#080810` | Violet |
| Midnight | `#000008` | Blue |
| Ocean | `#020c14` | Cyan |
| Light | `#f8fafc` | Violet |

Theme is saved on the server and applied immediately on login via CSS `data-theme` attribute.
