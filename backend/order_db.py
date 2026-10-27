"""
order_db.py
------------
MongoDB Atlas connection + order tracking CRUD functions.
"""

import os
from datetime import datetime
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "customer_support_db")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found. Did you create a .env file from .env.example?")

client = MongoClient(
    MONGO_URI,
    tlsCAFile=certifi.where(),
    tlsDisableOCSPEndpointCheck=True,
)
db = client[DB_NAME]
orders_collection = db["orders"]

def check_connection():
    try:
        client.admin.command("ping")
        print("MongoDB Atlas connected successfully.")
        return True
    except ConnectionFailure as e:
        print("MongoDB connection failed:", e)
        return False


def get_all_orders():
    orders = list(orders_collection.find({}, {"_id": 0}))
    return orders


def get_order_by_id(order_id):
    order = orders_collection.find_one({"order_id": order_id}, {"_id": 0, "order_id": 0})
    return order


def create_order(order_id, status, date, items, expected, location):
    order = {
        "order_id": order_id,
        "status": status,
        "date": date,
        "items": items,
        "expected": expected,
        "location": location,
    }
    orders_collection.insert_one(order)
    order.pop("_id", None)
    return order


def update_order_status(order_id, new_status):
    result = orders_collection.update_one(
        {"order_id": order_id},
        {"$set": {"status": new_status}}
    )
    return result.modified_count > 0


def delete_order(order_id):
    result = orders_collection.delete_one({"order_id": order_id})
    return result.deleted_count > 0


def get_status_summary():
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    results = orders_collection.aggregate(pipeline)
    summary = {}
    for row in results:
        summary[row["_id"]] = row["count"]
    return summary
