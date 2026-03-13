# backend/routers/auth.py

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from ..db import db
from ..utils.jwt_handler import hash_password, verify_password, create_access_token, decode_access_token
from pymongo.errors import PyMongoError
import uuid
from datetime import datetime, timezone

router = APIRouter()

# ==========================
# Pydantic Models
# ==========================
class SignupModel(BaseModel):
    username: str
    email: EmailStr
    password: str
    preferred_currency: str = "INR"

class LoginModel(BaseModel):
    username: str
    password: str

# ==========================
# SIGNUP
# ==========================
@router.post("/signup")
async def signup(user: SignupModel) -> dict:
    """Endpoint to register a new user."""
    normalized_username = user.username.strip()
    normalized_email = user.email.strip().lower()

    if not normalized_username:
        raise HTTPException(400, "Username cannot be empty")

    try:
        # Check if user exists
        existing = await db.users.find_one({"username": normalized_username})
        if existing:
            raise HTTPException(400, "Username already exists")

        existing_email = await db.users.find_one({"email": normalized_email})
        if existing_email:
            raise HTTPException(400, "Email already exists")
    except PyMongoError:
        raise HTTPException(503, "Database unavailable. Please try again later.")

    # Create new user
    user_id = str(uuid.uuid4())

    new_user = {
        "_id": user_id,
        "username": normalized_username,
        "email": normalized_email,
        "password_hash": hash_password(user.password),
        "preferred_currency": user.preferred_currency,
        "created_at": datetime.now(timezone.utc)
    }

    # Insert into DB
    try:
        await db.users.insert_one(new_user)
    except PyMongoError:
        raise HTTPException(503, "Database unavailable. Please try again later.")

    return {"message": "User created successfully", "user_id": user_id}

# ==========================
# LOGIN
# ==========================
@router.post("/login")
async def login(credentials: LoginModel) -> dict:
    """Endpoint to authenticate a user and return a JWT."""
    identifier = credentials.username.strip()

    # Fetch user from DB
    try:
        user = await db.users.find_one(
            {
                "$or": [
                    {"username": identifier},
                    {"email": identifier.lower()},
                ]
            }
        )
    except PyMongoError:
        raise HTTPException(503, "Database unavailable. Please try again later.")
    if not user:
        raise HTTPException(401, "Invalid username or password")

    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(401, "Invalid username or password")

    # Create JWT token
    token = create_access_token({"user_id": user["_id"], "username": user["username"]})

    return {"access_token": token, "token_type": "bearer"}
