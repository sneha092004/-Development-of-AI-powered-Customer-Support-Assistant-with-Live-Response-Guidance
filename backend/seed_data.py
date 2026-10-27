"""
seed_data.py
------------
Run this ONCE to fill your MongoDB with the order data that used to be
hardcoded in app.py's ORDERS dict, plus a couple extra for demo variety.
Usage: python seed_data.py
"""

from order_db import orders_collection, check_connection

sample_orders = [
    {
        "order_id": "ORD12345",
        "status": "Shipped",
        "date": "2026-08-28",
        "items": "Wireless Headphones x1",
        "expected": "2026-09-06",
        "location": "Indore Delivery Hub",
    },
    {
        "order_id": "ORD98765",
        "status": "Delayed",
        "date": "2026-09-02",
        "items": "Running Shoes x1",
        "expected": "2026-09-07",
        "location": "Bhopal Sorting Center",
    },
    {
        "order_id": "ORD55555",
        "status": "Delivered",
        "date": "2026-08-15",
        "items": "Coffee Maker x1",
        "expected": "2026-08-20",
        "location": "Indore",
    },
    {
        "order_id": "ORD11111",
        "status": "Shipped",
        "date": "2026-09-20",
        "items": "Bluetooth Speaker x1",
        "expected": "2026-09-29",
        "location": "Mumbai Delivery Hub",
    },
    {
        "order_id": "ORD22222",
        "status": "Delayed",
        "date": "2026-09-18",
        "items": "Backpack x1",
        "expected": "2026-09-25",
        "location": "Pune Sorting Center",
    },
]

def seed():
    if not check_connection():
        print("Aborting: could not connect to MongoDB Atlas. Check your .env file.")
        return

    # Avoid duplicate inserts if you run this script more than once
    orders_collection.delete_many({})
    orders_collection.insert_many(sample_orders)
    print(f"Inserted {len(sample_orders)} orders into the 'orders' collection.")

if __name__ == "__main__":
    seed()
    