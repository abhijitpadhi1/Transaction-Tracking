from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from ..db import db
from ..utils.jwt_handler import get_current_user
import uuid

router = APIRouter()

# ==============================
# Models
# ==============================
class CategoryModel(BaseModel):
    name: str
    icon: str | None = None   # your UI uses icons
    type: str                 # income or expense

# ==============================
# Add Category
# ==============================
@router.post("/add")
async def add_category(data: CategoryModel, user=Depends(get_current_user)) -> dict:
    """Endpoint to add a new category."""

    # Check if category exists
    existing = await db.categories.find_one({
        "user_id": user["user_id"],
        "name": data.name,
        "type": data.type
    })
    if existing:
        raise HTTPException(400, "Category already exists")

    # Prepare new category data
    cat_id = str(uuid.uuid4())
    new_cat = {
        "_id": cat_id,
        "user_id": user["user_id"],
        "name": data.name,
        "icon": data.icon,
        "type": data.type,
        "created_at": datetime.now()
    }

    # Insert into DB
    await db.categories.insert_one(new_cat)

    return {"message": "Category added", "category_id": cat_id}


# ==============================
# List Categories
# ==============================
@router.get("/list")
async def list_categories(user=Depends(get_current_user)) -> list[dict]:
    """Endpoint to list all categories of the user."""

    cursor = db.categories.find({"user_id": user["user_id"]})
    data = await cursor.to_list(length=999)
    return data

# ==============================
# Delete Category
# ==============================
@router.delete("/delete/{category_id}")
async def delete_category(category_id: str, user=Depends(get_current_user)) -> dict:
    """Endpoint to delete a category"""
    # Check if category exists
    cat = await db.categories.find_one({"_id": category_id, "user_id": user["user_id"]})
    if not cat:
        raise HTTPException(404, "Category not found")

    # Delete category
    await db.categories.delete_one({"_id": category_id})
    return {"message": "Category deleted"}


