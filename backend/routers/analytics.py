from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from ..db import db
from ..utils.jwt_handler import get_current_user

router = APIRouter()

# ==========================================
# PIE CHART DATA (Category-wise expense %)
# ==========================================
@router.get("/pie")
async def pie_chart(user=Depends(get_current_user)) -> dict:
    """Endpoint to get category-wise expense totals for pie chart."""
    # Fetch all expense transactions of the user
    cursor = db.transactions.find(
        {"user_id": user["user_id"], "type": "expense"}
    )
    tx_list = await cursor.to_list(length=9999)

    # Calculate total expenses per category
    category_totals = {}
    for tx in tx_list:
        cat = tx["category"]
        category_totals[cat] = category_totals.get(cat, 0) + tx["amount"]

    return category_totals

# ==========================================
# BAR CHART DATA (Last 7 or 30 days)
# ==========================================
@router.get("/bar")
async def bar_chart(days: int = 7, user=Depends(get_current_user)) -> dict:
    """
    Endpoint to get daily expense totals for bar chart.
    days=7  -> last week chart
    days=30 -> last month chart
    """
    # Fetch expense transactions in the given period
    end = datetime.now()
    start = end - timedelta(days=days)

    # Fetch expense transactions in the given period
    cursor = db.transactions.find(
        {
            "user_id": user["user_id"],
            "date": {"$gte": start}
        }
    )
    tx_list = await cursor.to_list(length=9999)

    # Group by date
    daily_totals = {}

    for tx in tx_list:
        d = tx["date"].date().strftime("%Y-%m-%d")
        daily_totals[d] = daily_totals.get(d, 0) + tx["amount"]

    return daily_totals

# ==========================================
# TOP CATEGORIES (Highest spending first)
# ==========================================
@router.get("/top-categories")
async def top_categories(user=Depends(get_current_user)) -> list[dict]:
    """Endpoint to get top spending categories."""
    # Fetch all expense transactions of the user
    cursor = db.transactions.find(
        {"user_id": user["user_id"], "type": "expense"}
    )
    tx_list = await cursor.to_list(length=9999)

    # Calculate total expenses per category
    totals = {}
    for tx in tx_list:
        cat = tx["category"]
        totals[cat] = totals.get(cat, 0) + tx["amount"]

    # Sort high to low
    sorted_data = sorted(
        [{"category": cat, "amount": amt} for cat, amt in totals.items()],
        key=lambda x: x["amount"],
        reverse=True
    )
    
    return sorted_data


# ==========================================
# MONTHLY SUMMARY (Income vs Expense)
# ==========================================
@router.get("/monthly-summary")
async def monthly_summary(user=Depends(get_current_user)) -> dict:
    """Endpoint to get monthly summary of income, expense, and balance."""
    # Calculate the start of the current month
    now = datetime.now()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Fetch all transactions of the user since start of month
    cursor = db.transactions.find(
        {"user_id": user["user_id"], "date": {"$gte": start}}
    )
    tx_list = await cursor.to_list(length=9999)

    # Calculate summary
    income = sum(tx["amount"] for tx in tx_list if tx["type"] == "income")
    expense = sum(tx["amount"] for tx in tx_list if tx["type"] == "expense")

    return {
        "income": income,
        "expense": expense,
        "balance": income - expense
    }


