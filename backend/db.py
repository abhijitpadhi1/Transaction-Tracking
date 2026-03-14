# backend/db.py

import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables (local development only)
load_dotenv()

# MongoDB connection string
MONGO_URI = os.environ.get("MONGO_URI") or os.environ.get("MONGODB_URI")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "TransactionTracking")

if not MONGO_URI:
    raise Exception("MONGO_URI (or MONGODB_URI) is not set in environment variables.")

# Create Mongo client
client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)

# Select database explicitly
db = client[DATABASE_NAME]

# ---------------------------------------------------
# Database initialization helpers
# ---------------------------------------------------

async def init_db():
    """
    Ensure collections and indexes exist.
    """

    existing_collections = await db.list_collection_names()

    required_collections = [
        "users",
        "transactions",
        "categories",
        "settings"
    ]

    for collection in required_collections:
        if collection not in existing_collections:
            await db.create_collection(collection)
            print(f"Created collection: {collection}")

    # Users indexes
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)

    # Transactions indexes
    await db.transactions.create_index("user_id")
    await db.transactions.create_index("date")

    # Categories indexes
    await db.categories.create_index("user_id")

    print("Database indexes ensured.")

async def check_connection():
    """
    Verify MongoDB connection during startup.
    """
    try:
        await client.admin.command("ping")
        print("MongoDB connection successful.")
    except Exception as e:
        raise Exception(f"MongoDB connection failed: {e}")