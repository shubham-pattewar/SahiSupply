import math
import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from backend.core.models import (
    ProductCategory, NodeType, ProductSKU, NetworkNode,
    InventoryBatch, TransportRoute, DemandForecast
)

# Deterministic seed for reproducible realistic scenarios
random.seed(42)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    road_tortuosity_factor = 1.28  # Indian highway road distance factor over as-the-crow-flies
    return round(R * c * road_tortuosity_factor, 1)

def build_products() -> List[ProductSKU]:
    return [
        ProductSKU(
            sku="SKU-DAI-01",
            name="Amrit Malai Paneer 200g",
            category=ProductCategory.DAIRY_FRESH,
            shelf_life_days=14,
            min_retail_shelf_life_days=4,
            unit_cost=72.0,
            retail_price=95.0,
            weight_kg=0.22,
            cold_chain_required=True,
            unit_volume_m3=0.0006,
            case_pack_qty=24
        ),
        ProductSKU(
            sku="SKU-DAI-02",
            name="ProBio Greek Yogurt Berry 150g",
            category=ProductCategory.DAIRY_FRESH,
            shelf_life_days=21,
            min_retail_shelf_life_days=6,
            unit_cost=45.0,
            retail_price=65.0,
            weight_kg=0.17,
            cold_chain_required=True,
            unit_volume_m3=0.0005,
            case_pack_qty=18
        ),
        ProductSKU(
            sku="SKU-DAI-03",
            name="Nandini Fresh Flavored Milk 200ml",
            category=ProductCategory.DAIRY_FRESH,
            shelf_life_days=30,
            min_retail_shelf_life_days=8,
            unit_cost=25.0,
            retail_price=38.0,
            weight_kg=0.23,
            cold_chain_required=True,
            unit_volume_m3=0.0004,
            case_pack_qty=30
        ),
        ProductSKU(
            sku="SKU-BEV-01",
            name="PureValencia Cold-Pressed Juice 300ml",
            category=ProductCategory.BEVERAGES,
            shelf_life_days=45,
            min_retail_shelf_life_days=12,
            unit_cost=68.0,
            retail_price=110.0,
            weight_kg=0.33,
            cold_chain_required=True,
            unit_volume_m3=0.0007,
            case_pack_qty=12
        ),
        ProductSKU(
            sku="SKU-BEV-02",
            name="GreenElixir Coconut Hydration 500ml",
            category=ProductCategory.BEVERAGES,
            shelf_life_days=60,
            min_retail_shelf_life_days=15,
            unit_cost=55.0,
            retail_price=90.0,
            weight_kg=0.52,
            cold_chain_required=False,
            unit_volume_m3=0.0009,
            case_pack_qty=12
        ),
        ProductSKU(
            sku="SKU-PCK-01",
            name="NutriBake Oats Digestive 300g",
            category=ProductCategory.PACKAGED_FOODS,
            shelf_life_days=180,
            min_retail_shelf_life_days=45,
            unit_cost=42.0,
            retail_price=70.0,
            weight_kg=0.32,
            cold_chain_required=False,
            unit_volume_m3=0.0008,
            case_pack_qty=24
        ),
        ProductSKU(
            sku="SKU-PCK-02",
            name="DesiSpices Masala Noodles 4-Pack",
            category=ProductCategory.PACKAGED_FOODS,
            shelf_life_days=270,
            min_retail_shelf_life_days=60,
            unit_cost=38.0,
            retail_price=60.0,
            weight_kg=0.30,
            cold_chain_required=False,
            unit_volume_m3=0.0014,
            case_pack_qty=24
        ),
        ProductSKU(
            sku="SKU-PCK-03",
            name="RoyalTruffle Dark Cocoa Bites 120g",
            category=ProductCategory.PACKAGED_FOODS,
            shelf_life_days=120,
            min_retail_shelf_life_days=30,
            unit_cost=95.0,
            retail_price=160.0,
            weight_kg=0.14,
            cold_chain_required=False,
            unit_volume_m3=0.0005,
            case_pack_qty=16
        ),
        ProductSKU(
            sku="SKU-HPC-01",
            name="AyurHerb Botanical Scalp Shampoo 400ml",
            category=ProductCategory.PERSONAL_CARE,
            shelf_life_days=720,
            min_retail_shelf_life_days=180,
            unit_cost=140.0,
            retail_price=280.0,
            weight_kg=0.45,
            cold_chain_required=False,
            unit_volume_m3=0.0011,
            case_pack_qty=12
        ),
        ProductSKU(
            sku="SKU-HPC-02",
            name="BioClean Triple-Action Laundry Pods 30s",
            category=ProductCategory.PERSONAL_CARE,
            shelf_life_days=720,
            min_retail_shelf_life_days=180,
            unit_cost=210.0,
            retail_price=399.0,
            weight_kg=0.65,
            cold_chain_required=False,
            unit_volume_m3=0.0022,
            case_pack_qty=8
        )
    ]

def build_network_nodes() -> Tuple[List[NetworkNode], List[NetworkNode], List[NetworkNode]]:
    # Central Mother Warehouses (CWHs)
    cwhs = [
        NetworkNode(
            id="CWH-MUM",
            name="Western Apex Central Warehouse (Bhiwandi)",
            type=NodeType.CWH,
            city="Mumbai",
            state="Maharashtra",
            lat=19.2969,
            lng=73.0631,
            storage_capacity_units=350000,
            current_occupancy_units=265000,
            daily_throughput_capacity=45000,
            contact_person="Rajesh Sharma (CWH Lead)"
        ),
        NetworkNode(
            id="CWH-DEL",
            name="Northern Mega Plant & Hub (Kundli)",
            type=NodeType.CWH,
            city="Delhi NCR",
            state="Haryana",
            lat=28.8710,
            lng=77.1278,
            storage_capacity_units=400000,
            current_occupancy_units=310000,
            daily_throughput_capacity=50000,
            contact_person="Vikram Malhotra (VP Ops)"
        ),
        NetworkNode(
            id="CWH-BLR",
            name="Southern Apex Logistics Hub (Hosur-Attibele)",
            type=NodeType.CWH,
            city="Bengaluru",
            state="Karnataka",
            lat=12.7842,
            lng=77.7712,
            storage_capacity_units=300000,
            current_occupancy_units=215000,
            daily_throughput_capacity=38000,
            contact_person="K. Sundaram (Plant Director)"
        ),
        NetworkNode(
            id="CWH-CCU",
            name="Eastern Gateway Distribution Plant (Dankuni)",
            type=NodeType.CWH,
            city="Kolkata",
            state="West Bengal",
            lat=22.6841,
            lng=88.2917,
            storage_capacity_units=250000,
            current_occupancy_units=180000,
            daily_throughput_capacity=30000,
            contact_person="Anirban Mukherjee (Hub Head)"
        )
    ]

    # Regional Distribution Centers (RDCs)
    rdcs = [
        NetworkNode(
            id="RDC-PUN",
            name="Maharashtra Regional Distribution Hub",
            type=NodeType.RDC,
            city="Pune",
            state="Maharashtra",
            lat=18.5204,
            lng=73.8567,
            storage_capacity_units=90000,
            current_occupancy_units=68000,
            daily_throughput_capacity=14000
        ),
        NetworkNode(
            id="RDC-AMD",
            name="Gujarat State Distribution Center",
            type=NodeType.RDC,
            city="Ahmedabad",
            state="Gujarat",
            lat=23.0225,
            lng=72.5714,
            storage_capacity_units=85000,
            current_occupancy_units=59000,
            daily_throughput_capacity=12000
        ),
        NetworkNode(
            id="RDC-LKO",
            name="Awadh & Central UP Logistics Hub",
            type=NodeType.RDC,
            city="Lucknow",
            state="Uttar Pradesh",
            lat=26.8467,
            lng=80.9462,
            storage_capacity_units=95000,
            current_occupancy_units=72000,
            daily_throughput_capacity=15000
        ),
        NetworkNode(
            id="RDC-JAI",
            name="Rajasthan Central Replenishment Hub",
            type=NodeType.RDC,
            city="Jaipur",
            state="Rajasthan",
            lat=26.9124,
            lng=75.7873,
            storage_capacity_units=75000,
            current_occupancy_units=48000,
            daily_throughput_capacity=11000
        ),
        NetworkNode(
            id="RDC-HYD",
            name="Telangana Regional Hub (Medchal)",
            type=NodeType.RDC,
            city="Hyderabad",
            state="Telangana",
            lat=17.3850,
            lng=78.4867,
            storage_capacity_units=90000,
            current_occupancy_units=64000,
            daily_throughput_capacity=13500
        ),
        NetworkNode(
            id="RDC-MAA",
            name="Tamil Nadu Distribution Center (Sriperumbudur)",
            type=NodeType.RDC,
            city="Chennai",
            state="Tamil Nadu",
            lat=13.0827,
            lng=80.2707,
            storage_capacity_units=95000,
            current_occupancy_units=71000,
            daily_throughput_capacity=14500
        ),
        NetworkNode(
            id="RDC-PAT",
            name="Bihar Regional Supply Depot",
            type=NodeType.RDC,
            city="Patna",
            state="Bihar",
            lat=25.5941,
            lng=85.1376,
            storage_capacity_units=65000,
            current_occupancy_units=43000,
            daily_throughput_capacity=9500
        ),
        NetworkNode(
            id="RDC-GAU",
            name="North-East Gateway Depot (Amingaon)",
            type=NodeType.RDC,
            city="Guwahati",
            state="Assam",
            lat=26.1445,
            lng=91.7362,
            storage_capacity_units=50000,
            current_occupancy_units=34000,
            daily_throughput_capacity=7000
        )
    ]

    # Destination Retail Outlets, Modern Trade Supermarkets, Quick Commerce Dark Stores
    destinations = [
        NetworkNode(
            id="DEST-MUM-QC",
            name="Bandra & Andheri Quick Commerce Dark Stores",
            type=NodeType.DARK_STORE,
            city="Mumbai",
            state="Maharashtra",
            lat=19.0596,
            lng=72.8295,
            storage_capacity_units=18000,
            current_occupancy_units=13200,
            daily_throughput_capacity=6000
        ),
        NetworkNode(
            id="DEST-MUM-MT",
            name="Malad Mega Modern Trade Supercenter",
            type=NodeType.RETAIL_SUPERMARKET,
            city="Mumbai",
            state="Maharashtra",
            lat=19.1860,
            lng=72.8485,
            storage_capacity_units=24000,
            current_occupancy_units=16800,
            daily_throughput_capacity=4500
        ),
        NetworkNode(
            id="DEST-PUN-GT",
            name="Pune Camp Kirana Wholesale Cluster",
            type=NodeType.GENERAL_TRADE,
            city="Pune",
            state="Maharashtra",
            lat=18.5140,
            lng=73.8780,
            storage_capacity_units=20000,
            current_occupancy_units=14500,
            daily_throughput_capacity=3800
        ),
        NetworkNode(
            id="DEST-DEL-QC",
            name="Gurgaon Cyber City Quick Commerce Hub",
            type=NodeType.DARK_STORE,
            city="Gurgaon",
            state="Haryana",
            lat=28.4595,
            lng=77.0266,
            storage_capacity_units=22000,
            current_occupancy_units=15000,
            daily_throughput_capacity=7500
        ),
        NetworkNode(
            id="DEST-DEL-MT",
            name="Saket Select Citywalk Hypermarket",
            type=NodeType.RETAIL_SUPERMARKET,
            city="Delhi NCR",
            state="Delhi",
            lat=28.5286,
            lng=77.2185,
            storage_capacity_units=28000,
            current_occupancy_units=20200,
            daily_throughput_capacity=5200
        ),
        NetworkNode(
            id="DEST-NOI-GT",
            name="Noida Sector 18 Retail Network",
            type=NodeType.GENERAL_TRADE,
            city="Noida",
            state="Uttar Pradesh",
            lat=28.5708,
            lng=77.3271,
            storage_capacity_units=17000,
            current_occupancy_units=11900,
            daily_throughput_capacity=3200
        ),
        NetworkNode(
            id="DEST-BLR-QC",
            name="Indiranagar & Koramangala Dark Stores",
            type=NodeType.DARK_STORE,
            city="Bengaluru",
            state="Karnataka",
            lat=12.9719,
            lng=77.6412,
            storage_capacity_units=25000,
            current_occupancy_units=18400,
            daily_throughput_capacity=8000
        ),
        NetworkNode(
            id="DEST-BLR-MT",
            name="Whitefield Forum Mall Hypermarket",
            type=NodeType.RETAIL_SUPERMARKET,
            city="Bengaluru",
            state="Karnataka",
            lat=12.9698,
            lng=77.7499,
            storage_capacity_units=26000,
            current_occupancy_units=17500,
            daily_throughput_capacity=4800
        ),
        NetworkNode(
            id="DEST-HYD-QC",
            name="HITEC City 10-Minute Dark Stores",
            type=NodeType.DARK_STORE,
            city="Hyderabad",
            state="Telangana",
            lat=17.4435,
            lng=78.3772,
            storage_capacity_units=20000,
            current_occupancy_units=14100,
            daily_throughput_capacity=6500
        ),
        NetworkNode(
            id="DEST-MAA-MT",
            name="Anna Nagar Supermarket & Cash-and-Carry",
            type=NodeType.RETAIL_SUPERMARKET,
            city="Chennai",
            state="Tamil Nadu",
            lat=13.0850,
            lng=80.2101,
            storage_capacity_units=22000,
            current_occupancy_units=15600,
            daily_throughput_capacity=4200
        ),
        NetworkNode(
            id="DEST-AMD-GT",
            name="Navrangpura Consumer Marts Cluster",
            type=NodeType.GENERAL_TRADE,
            city="Ahmedabad",
            state="Gujarat",
            lat=23.0373,
            lng=72.5524,
            storage_capacity_units=16000,
            current_occupancy_units=10800,
            daily_throughput_capacity=3100
        ),
        NetworkNode(
            id="DEST-JAI-MT",
            name="Jaipur Vaishali Nagar Modern Trade",
            type=NodeType.RETAIL_SUPERMARKET,
            city="Jaipur",
            state="Rajasthan",
            lat=26.9075,
            lng=75.7396,
            storage_capacity_units=18000,
            current_occupancy_units=12400,
            daily_throughput_capacity=3400
        ),
        NetworkNode(
            id="DEST-LKO-GT",
            name="Lucknow Gomti Nagar Kirana Network",
            type=NodeType.GENERAL_TRADE,
            city="Lucknow",
            state="Uttar Pradesh",
            lat=26.8500,
            lng=81.0000,
            storage_capacity_units=17500,
            current_occupancy_units=11200,
            daily_throughput_capacity=3300
        ),
        NetworkNode(
            id="DEST-CCU-MT",
            name="Salt Lake City Mega Mart",
            type=NodeType.RETAIL_SUPERMARKET,
            city="Kolkata",
            state="West Bengal",
            lat=22.5867,
            lng=88.4178,
            storage_capacity_units=23000,
            current_occupancy_units=16100,
            daily_throughput_capacity=4400
        ),
        NetworkNode(
            id="DEST-PAT-GT",
            name="Patna Bailey Road Wholesale & Retail",
            type=NodeType.GENERAL_TRADE,
            city="Patna",
            state="Bihar",
            lat=25.6110,
            lng=85.1100,
            storage_capacity_units=15000,
            current_occupancy_units=9800,
            daily_throughput_capacity=2800
        ),
        NetworkNode(
            id="DEST-GAU-GT",
            name="Guwahati GS Road Consumer Center",
            type=NodeType.GENERAL_TRADE,
            city="Guwahati",
            state="Assam",
            lat=26.1600,
            lng=91.7700,
            storage_capacity_units=14000,
            current_occupancy_units=8900,
            daily_throughput_capacity=2500
        )
    ]

    return cwhs, rdcs, destinations

def build_transport_routes(origins: List[NetworkNode], destinations: List[NetworkNode]) -> List[TransportRoute]:
    routes = []
    base_rate_per_km_ton = 4.2  # ₹4.20 per ton-km standard Indian road freight
    for orig in origins:
        for dest in destinations:
            dist = haversine_distance(orig.lat, orig.lng, dest.lat, dest.lng)
            # Average truck speed: 42 km/h + 2.5h loading/unloading/checkpost buffer
            lead_time = round((dist / 42.0) + 2.5, 1)
            # Cost per kg = (dist * base_rate) / 1000
            rate_per_kg = round(max(0.65, (dist * base_rate_per_km_ton) / 1000.0), 3)

            routes.append(TransportRoute(
                origin_id=orig.id,
                destination_id=dest.id,
                distance_km=dist,
                transit_lead_time_hours=lead_time,
                freight_rate_per_kg=rate_per_kg,
                reefer_surcharge_pct=0.28,
                carbon_factor_kg_ton_km=0.082
            ))
    return routes

def generate_inventory_batches(
    warehouses: List[NetworkNode],
    products: List[ProductSKU],
    current_date: datetime = datetime(2026, 10, 24)
) -> List[InventoryBatch]:
    batches = []
    batch_counter = 100

    for wh in warehouses:
        for p in products:
            # Generate 2 to 4 distinct batches per SKU per warehouse with varying ages
            num_batches = random.randint(2, 4)
            for i in range(num_batches):
                batch_counter += 1
                batch_id = f"BAT-{p.category.name[:3]}-{batch_counter}"

                # Intentionally assign some batches to be critical aging/near-expiry
                # to test FEFO salvage logic!
                age_bracket = random.choices(["FRESH", "AGING", "CRITICAL_FEFO"], weights=[0.45, 0.35, 0.20])[0]

                if age_bracket == "FRESH":
                    age_days = int(p.shelf_life_days * random.uniform(0.08, 0.28))
                elif age_bracket == "AGING":
                    age_days = int(p.shelf_life_days * random.uniform(0.40, 0.65))
                else:  # CRITICAL_FEFO
                    # Between 70% and 85% of shelf life elapsed
                    age_days = int(p.shelf_life_days * random.uniform(0.72, 0.86))

                mfg = current_date - timedelta(days=age_days)
                exp = mfg + timedelta(days=p.shelf_life_days)
                days_left = max(1, (exp - current_date).days)
                rsl_pct = round((days_left / p.shelf_life_days) * 100.0, 1)

                # Batch quantity depends on warehouse capacity and category
                base_qty = random.randint(600, 3200) if wh.type == NodeType.CWH else random.randint(250, 1200)
                # Align with case pack
                units = (base_qty // p.case_pack_qty) * p.case_pack_qty

                status_label = "FRESH"
                if rsl_pct <= 28.0:
                    status_label = "CRITICAL_FEFO"
                elif rsl_pct <= 55.0:
                    status_label = "AGING"

                holding_cost = round(p.unit_cost * 0.0008, 4)  # ~0.08% per day holding cost

                batches.append(InventoryBatch(
                    batch_id=batch_id,
                    sku=p.sku,
                    product_name=p.name,
                    category=p.category,
                    warehouse_id=wh.id,
                    warehouse_name=wh.name,
                    units_available=units,
                    mfg_date=mfg.strftime("%Y-%m-%d"),
                    expiry_date=exp.strftime("%Y-%m-%d"),
                    days_to_expiry=days_left,
                    remaining_shelf_life_pct=rsl_pct,
                    holding_cost_per_day=holding_cost,
                    cold_chain=p.cold_chain_required,
                    status=status_label
                ))
    return batches

def generate_demand_forecasts(
    destinations: List[NetworkNode],
    products: List[ProductSKU],
    scenario_multiplier: float = 1.0
) -> List[DemandForecast]:
    forecasts = []

    # Regional demand multipliers / festival event flags
    event_calendar = {
        "DEST-DEL-QC": ("Diwali Festive Pre-Ordering & Gifting Surge", 1.45),
        "DEST-DEL-MT": ("Diwali Modern Trade Mega Savings Week", 1.40),
        "DEST-NOI-GT": ("Pre-Festive Stocking", 1.25),
        "DEST-CCU-MT": ("Durga Puja Festive Demand Peak", 1.50),
        "DEST-MUM-QC": ("Weekend Quick-Commerce Grocery Rush", 1.30),
        "DEST-BLR-QC": ("Tech-Corridor Weekend Rush", 1.25),
        "DEST-HYD-QC": ("IT Park Dark Store Rush", 1.20),
    }

    for dest in destinations:
        event_name, regional_promo = event_calendar.get(dest.id, (None, 1.0))
        for p in products:
            # Baseline demand depends on store type and category
            if dest.type == NodeType.DARK_STORE:
                # Dark stores sell ultra-fresh, dairy & beverages fast!
                category_boost = 1.6 if p.category in [ProductCategory.DAIRY_FRESH, ProductCategory.BEVERAGES] else 1.0
                base_daily = random.randint(180, 480) * category_boost
            elif dest.type == NodeType.RETAIL_SUPERMARKET:
                # Modern trade has high grocery & packaged goods basket
                category_boost = 1.5 if p.category in [ProductCategory.PACKAGED_FOODS, ProductCategory.PERSONAL_CARE] else 1.1
                base_daily = random.randint(220, 550) * category_boost
            else:
                base_daily = random.randint(120, 320)

            # 7-day planning window forecast
            base_window = int(base_daily * 7)

            total_multiplier = regional_promo * scenario_multiplier
            forecasted = int(base_window * total_multiplier)

            # Volatility sigma
            sigma = forecasted * 0.14
            p10 = int(max(0, forecasted - 1.28 * sigma))
            p50 = forecasted
            p90 = int(forecasted + 1.28 * sigma)

            # Safety stock: 95% service level factor (Z=1.645) * sigma * sqrt(lead time ratio)
            safety_stock = int(1.645 * sigma * 0.6)

            # Current stock at destination (some locations severely stocked out, some excess)
            # Create a deliberate imbalance to demonstrate AI intelligence!
            imbalance_factor = random.choice([0.15, 0.25, 0.50, 0.85, 1.30])
            on_hand = int(forecasted * imbalance_factor)

            net_need = max(0, (forecasted + safety_stock) - on_hand)
            # Align with case pack
            net_need = (net_need // p.case_pack_qty + 1) * p.case_pack_qty if net_need > 0 else 0

            forecasts.append(DemandForecast(
                destination_id=dest.id,
                destination_name=dest.name,
                sku=p.sku,
                product_name=p.name,
                category=p.category,
                base_demand=base_window,
                forecasted_units=forecasted,
                p10_units=p10,
                p50_units=p50,
                p90_units=p90,
                safety_stock_required=safety_stock,
                current_inventory_on_hand=on_hand,
                net_requirement=net_need,
                promo_multiplier=round(total_multiplier, 2),
                festival_event=event_name
            ))
    return forecasts
