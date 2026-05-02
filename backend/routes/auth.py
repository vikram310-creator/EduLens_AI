import os
import uuid
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header, status
from typing import Optional
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from database.db import get_db
from models.models import User

router = APIRouter()

# ── Config ──────────────────────────────────────────────────────────────────
SECRET_KEY  = os.environ.get("JWT_SECRET", "change-me-in-production-please")
ALGORITHM   = "HS256"
ACCESS_TTL  = timedelta(days=30)

GOOGLE_CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/google/callback")

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Helpers ──────────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_token(user_id: str) -> str:
    exp = datetime.utcnow() + ACCESS_TTL
    return jwt.encode({"sub": user_id, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid: str = payload.get("sub")
        if uid is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return uid
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def user_response(user: User, token: str):
    return {
        "token": token,
        "user": {
            "id":         user.id,
            "email":      user.email,
            "name":       user.name,
            "avatar_url": user.avatar_url,
            "theme":      user.theme,
            "provider":   user.provider,
        }
    }

# ── Schemas ──────────────────────────────────────────────────────────────────
class RegisterBody(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginBody(BaseModel):
    email: str
    password: str

class GoogleCallbackBody(BaseModel):
    code: str

class UpdateThemeBody(BaseModel):
    theme: str

class UpdateProfileBody(BaseModel):
    name: str = ""

# ── Email / Password ─────────────────────────────────────────────────────────
@router.post("/auth/register")
def register(body: RegisterBody, db: DBSession = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        email=body.email,
        name=body.name or body.email.split("@")[0],
        provider="email",
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_response(user, create_token(user.id))

@router.post("/auth/login")
def login(body: LoginBody, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user_response(user, create_token(user.id))

# ── Google OAuth ─────────────────────────────────────────────────────────────
@router.get("/auth/google/url")
def google_auth_url():
    """Return the Google OAuth URL for the frontend to redirect to."""
    params = (
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
        "&prompt=consent"
    )
    return {"url": f"https://accounts.google.com/o/oauth2/v2/auth?{params}"}

@router.post("/auth/google/callback")
async def google_callback(body: GoogleCallbackBody, db: DBSession = Depends(get_db)):
    """Exchange OAuth code for tokens, upsert user, return JWT."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth not configured on server")

    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          body.code,
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri":  GOOGLE_REDIRECT_URI,
                "grant_type":    "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google code")
        access_token = token_resp.json().get("access_token")

        # Fetch user info
        info_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if info_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")
        info = info_resp.json()

    email      = info.get("email")
    name       = info.get("name", "")
    avatar_url = info.get("picture", "")

    user = db.query(User).filter(User.email == email).first()
    if user:
        # Update profile info on every login
        user.name       = name or user.name
        user.avatar_url = avatar_url or user.avatar_url
        if user.provider != "google":
            user.provider = "google"
        db.commit()
        db.refresh(user)
    else:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            avatar_url=avatar_url,
            provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user_response(user, create_token(user.id))

# ── Profile ──────────────────────────────────────────────────────────────────
@router.get("/auth/me")
def me(authorization: Optional[str] = Header(None, alias="Authorization"), db: DBSession = Depends(get_db)):
    """Validate token and return current user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    uid  = decode_token(authorization[7:])
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id":         user.id,
        "email":      user.email,
        "name":       user.name,
        "avatar_url": user.avatar_url,
        "theme":      user.theme,
        "provider":   user.provider,
    }

@router.patch("/auth/theme")
def update_theme(body: UpdateThemeBody, authorization: Optional[str] = Header(None, alias="Authorization"), db: DBSession = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    uid  = decode_token(authorization[7:])
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.theme = body.theme
    db.commit()
    return {"theme": user.theme}

@router.patch("/auth/profile")
def update_profile(body: UpdateProfileBody, authorization: Optional[str] = Header(None, alias="Authorization"), db: DBSession = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    uid  = decode_token(authorization[7:])
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.name:
        user.name = body.name
    db.commit()
    return {"id": user.id, "name": user.name, "email": user.email,
            "avatar_url": user.avatar_url, "theme": user.theme}
