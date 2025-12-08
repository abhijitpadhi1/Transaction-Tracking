from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from bson import ObjectId 
from ..db import db
from ..utils.jwt_handler import get_current_user
import uuid

router = APIRouter()

# ===========================
# Models
# ===========================
class TransactionModel(BaseModel):
    amount: float
    type: str  # "income" or "expense"
    category: str
    note: str | None = None
    date: datetime = datetime.now()

# ===========================
# Create Transaction
# ===========================
@router.post("/add")
async def add_transaction(data: TransactionModel, user=Depends(get_current_user)) -> dict:
    """Endpoint to add a new transaction."""
    # Validate type
    if data.type not in ["income", "expense"]:
        raise HTTPException(400, "Invalid type: must be income or expense")

    tx_id = str(uuid.uuid4())

    # Create transaction record
    new_tx = {
        "_id": tx_id,
        "user_id": user["user_id"],
        "amount": data.amount,
        "type": data.type,
        "category": data.category,
        "note": data.note,
        "date": data.date,
    }

    # Insert into DB
    await db.transactions.insert_one(new_tx)

    return {"message": "Transaction added", "transaction_id": tx_id}

# ===========================
# Get Recent Transactions (latest 5)
# ===========================
@router.get("/recent")
async def get_recent(user=Depends(get_current_user)) -> list[dict]:
    """Endpoint to get the 5 most recent transactions of the user."""
    # Fetch from DB
    cursor = db.transactions.find(
        {"user_id": user["user_id"]},
        sort=[("date", -1)],
        limit=5
    )

    # Convert cursor to list
    data = await cursor.to_list(length=5)
    return data

# ===========================
# Full History (Grouped by Date)
# ===========================
@router.get("/history")
async def get_history(user=Depends(get_current_user)) -> dict:
    """Endpoint to get full transaction history grouped by date."""
    # Fetch all transactions
    cursor = db.transactions.find(
        {"user_id": user["user_id"]},
        sort=[("date", -1)]
    )
    tx_list = await cursor.to_list(length=9999)

    # Group by date
    grouped = {}
    today = datetime.now().date()

    for tx in tx_list:
        tx_date = tx["date"].date()

        if tx_date == today:
            key = "Today"
        elif tx_date == (today.replace(day=today.day - 1)):
            key = "Yesterday"
        else:
            key = tx_date.strftime("%Y-%m-%d")

        if key not in grouped:
            grouped[key] = []
        grouped[key].append(tx)

    return grouped


# ===========================
# Filtered Transactions (daily, weekly, monthly)
# ===========================
@router.get("/filter")
async def filter_transactions(type: str, user=Depends(get_current_user)) -> list[dict]:
    """Endpoint to get transactions filtered by time period: daily, weekly, monthly."""
    today = datetime.now()
    start = None

    # Determine start date based on filter type
    if type == "daily":
        start = today.replace(hour=0, minute=0, second=0, microsecond=0)

    # Determine start date based on filter type
    elif type == "weekly":
        start = today - timedelta(days=today.weekday())  # Monday
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)

    # Determine start date based on filter type
    elif type == "monthly":
        start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    else:
        raise HTTPException(400, "Invalid filter type: daily/weekly/monthly")

    # Fetch filtered transactions
    cursor = db.transactions.find(
        {
            "user_id": user["user_id"],
            "date": {"$gte": start}
        },
        sort=[("date", -1)]
    )

    return await cursor.to_list(length=9999)


# ===========================
# Summary Endpoint (income/expense/balance)
# ===========================
@router.get("/summary")
async def summary(user=Depends(get_current_user)) -> dict[str, float]:
    """Endpoint to get summary of total income, expense, and balance."""
    # Fetch all transactions
    cursor = db.transactions.find({"user_id": user["user_id"]})
    tx_list = await cursor.to_list(length=99999)

    # Calculate summary
    income = sum(tx["amount"] for tx in tx_list if tx["type"] == "income")
    expense = sum(tx["amount"] for tx in tx_list if tx["type"] == "expense")
    balance = income - expense

    return {
        "total_income": income,
        "total_expense": expense,
        "balance": balance
    }


# ===========================
# UPDATE TRANSACTION
# ===========================
@router.put("/update/{transaction_id}")
async def update_transaction(
    transaction_id: str,
    data: TransactionModel,
    user=Depends(get_current_user)
) -> dict:
    """Endpoint to update an existing transaction."""

    # Convert ID to ObjectId only if using ObjectId
    # If you're using UUID (string), do not convert
    # Fetch existing transaction
    tx = await db.transactions.find_one({"_id": transaction_id, "user_id": user["user_id"]})
    if not tx:
        raise HTTPException(404, "Transaction not found")

    # Prepare updated data
    updated_data = {
        "amount": data.amount,
        "type": data.type,
        "category": data.category,
        "note": data.note,
        "date": data.date
    }

    # Update in DB
    await db.transactions.update_one(
        {"_id": transaction_id},
        {"$set": updated_data}
    )

    return {"message": "Transaction updated"}


# ===========================
# DELETE TRANSACTION
# ===========================
@router.delete("/delete/{transaction_id}")
async def delete_transaction(transaction_id: str, user=Depends(get_current_user)) -> dict:
    """Endpoint to delete a transaction."""

    # Fetch existing transaction
    tx = await db.transactions.find_one({"_id": transaction_id, "user_id": user["user_id"]})
    if not tx:
        raise HTTPException(404, "Transaction not found")

    # Delete from DB
    await db.transactions.delete_one({"_id": transaction_id})
    
    return {"message": "Transaction deleted"}



