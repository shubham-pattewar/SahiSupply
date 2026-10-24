import os
import logging
from typing import Optional, Dict, Any
import pymongo
import mongomock

logger = logging.getLogger("sahisupply.db")
logging.basicConfig(level=logging.INFO)

class MongoDBManager:
    """
    MongoDB Connection Manager for SahiSupply.
    Supports MongoDB Atlas, local MongoDB daemon, and transparently falls back
    to in-memory mongomock if external MongoDB is unavailable.
    """
    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.db_name = os.getenv("MONGO_DB_NAME", "sahisupply_db")
        self.client = None
        self.db = None
        self.is_mock = False
        self.connect()

    def connect(self):
        try:
            # Try connecting to live MongoDB (local or Atlas) with short timeout
            real_client = pymongo.MongoClient(self.mongo_uri, serverSelectionTimeoutMS=1200)
            real_client.admin.command('ping')
            self.client = real_client
            self.db = self.client[self.db_name]
            self.is_mock = False
            logger.info(f"Connected to live MongoDB at {self.mongo_uri.split('@')[-1]} (Database: {self.db_name})")
        except Exception as e:
            logger.warning(f"Could not connect to live MongoDB: {e}. Falling back to in-memory mongomock.")
            self.client = mongomock.MongoClient()
            self.db = self.client[self.db_name]
            self.is_mock = True
            logger.info(f"Initialized in-memory MongoDB mock (Database: {self.db_name})")

    def get_collection(self, name: str):
        return self.db[name]

    @property
    def warehouses(self):
        return self.db["warehouses"]

    @property
    def destinations(self):
        return self.db["destinations"]

    @property
    def products(self):
        return self.db["products"]

    @property
    def batches(self):
        return self.db["batches"]

    @property
    def routes(self):
        return self.db["routes"]

    @property
    def demand_history(self):
        return self.db["demand_history"]

    @property
    def forecasts(self):
        return self.db["forecasts"]

    @property
    def optimization_results(self):
        return self.db["optimization_results"]

# Global database singleton
mongo_manager = MongoDBManager()
