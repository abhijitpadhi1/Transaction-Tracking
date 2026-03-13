# backend/db.py

import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables (for local development)
load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI") or os.environ.get("MONGODB_URI")

if not MONGO_URI:
    raise Exception("MONGO_URI (or MONGODB_URI) is not set in environment variables.")

# Create a single Motor client (connection pool)
client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)

# Use default database from connection URI
db = client.get_default_database()

# Example: db.users , db.transactions , etc.
