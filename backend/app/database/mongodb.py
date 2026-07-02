from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


class MongoDB:
    client: AsyncIOMotorClient = None
    database = None


mongodb = MongoDB()


async def connect_to_mongo():
    mongodb.client = AsyncIOMotorClient(settings.mongodb_url)
    mongodb.database = mongodb.client[settings.database_name]

    print("✓ Connected to MongoDB")


async def close_mongo_connection():
    if mongodb.client:
        mongodb.client.close()
        print("✓ MongoDB connection closed")