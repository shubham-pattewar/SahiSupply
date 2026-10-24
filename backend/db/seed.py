import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any
from backend.db.mongo import mongo_manager
from backend.core.models import NodeType, ProductCategory
from backend.engine.generator import (
    build_products, build_network_nodes, build_transport_routes,
    generate_inventory_batches, generate_demand_forecasts
)

def generate_historical_demand_series(
    destinations: List[Any],
    products: List[Any],
    days: int = 90,
    end_date: datetime = datetime(2026, 10, 24)
) -> List[Dict[str, Any]]:
    """
    Generates 90 days of realistic daily demand history per (destination, product)
    with day-of-week seasonality, promotional lifts, regional festival multipliers,
    and gaussian noise to train and evaluate ML forecasting models.
    """
    history = []
    start_date = end_date - timedelta(days=days)

    event_calendar = {
        "DEST-DEL-QC": 1.45,
        "DEST-DEL-MT": 1.40,
        "DEST-NOI-GT": 1.25,
        "DEST-CCU-MT": 1.50,
        "DEST-MUM-QC": 1.30,
        "DEST-BLR-QC": 1.25,
        "DEST-HYD-QC": 1.20,
    }

    for dest in destinations:
        promo_factor = event_calendar.get(dest.id, 1.0)
        for prod in products:
            base_mean = 280.0 if dest.type == NodeType.DARK_STORE else (350.0 if dest.type == NodeType.RETAIL_SUPERMARKET else 180.0)
            if prod.category == ProductCategory.GROCERIES:
                base_mean *= 1.30
            elif prod.category == ProductCategory.COSMETICS:
                base_mean *= 0.95
            elif prod.category == ProductCategory.PHARMACEUTICALS:
                base_mean *= 1.10

            for d in range(days):
                curr_date = start_date + timedelta(days=d)
                day_of_week = curr_date.weekday()
                is_weekend = 1 if day_of_week in [5, 6] else 0

                # Weekend surge
                dow_multiplier = 1.35 if is_weekend else 0.90

                # Periodic marketing campaign (every 21 days for 4 days)
                is_promo = 1 if (d % 21) < 4 else 0
                promo_multiplier = 1.40 if (is_promo and prod.category == ProductCategory.COSMETICS) else (1.25 if is_promo else 1.0)

                # Festive surge in last 14 days
                festival_multiplier = 1.0
                if d >= (days - 14):
                    festival_multiplier = promo_factor

                # Synthetic temperature/weather index (e.g. 26 to 38 deg C)
                temperature = 28.0 + 6.0 * math.sin(d / 15.0) + random.uniform(-1.5, 1.5)
                temp_factor = 1.18 if (temperature > 32.0 and prod.category == ProductCategory.GROCERIES) else 1.0


                expected_demand = base_mean * dow_multiplier * promo_multiplier * festival_multiplier * temp_factor
                actual_demand = max(0, int(random.gauss(expected_demand, expected_demand * 0.12)))

                history.append({
                    "destination_id": dest.id,
                    "destination_name": dest.name,
                    "sku": prod.sku,
                    "product_name": prod.name,
                    "category": prod.category.value,
                    "date": curr_date.strftime("%Y-%m-%d"),
                    "day_of_week": day_of_week,
                    "is_weekend": is_weekend,
                    "is_promo": is_promo,
                    "temperature": round(temperature, 1),
                    "festival_multiplier": round(festival_multiplier, 2),
                    "actual_demand": actual_demand
                })

    return history

def seed_database():
    """
    Initializes and seeds MongoDB collections.
    """
    products = build_products()
    cwhs, rdcs, dests = build_network_nodes()
    warehouses = cwhs + rdcs
    routes = build_transport_routes(warehouses, dests)
    batches = generate_inventory_batches(warehouses, products)

    # 1. Seed Warehouses
    mongo_manager.warehouses.delete_many({})
    mongo_manager.warehouses.insert_many([w.model_dump() for w in warehouses])

    # 2. Seed Destinations
    mongo_manager.destinations.delete_many({})
    mongo_manager.destinations.insert_many([d.model_dump() for d in dests])

    # 3. Seed Products
    mongo_manager.products.delete_many({})
    mongo_manager.products.insert_many([p.model_dump() for p in products])

    # 4. Seed Batches
    mongo_manager.batches.delete_many({})
    mongo_manager.batches.insert_many([b.model_dump() for b in batches])

    # 5. Seed Routes
    mongo_manager.routes.delete_many({})
    mongo_manager.routes.insert_many([r.model_dump() for r in routes])

    # 6. Seed Historical Demand (90 days)
    mongo_manager.demand_history.delete_many({})
    history = generate_historical_demand_series(dests, products, days=60)
    mongo_manager.demand_history.insert_many(history)

    return {
        "status": "success",
        "warehouses_count": len(warehouses),
        "destinations_count": len(dests),
        "products_count": len(products),
        "batches_count": len(batches),
        "routes_count": len(routes),
        "demand_records_count": len(history)
    }

if __name__ == "__main__":
    res = seed_database()
    print("Database Seed Completed:", res)
