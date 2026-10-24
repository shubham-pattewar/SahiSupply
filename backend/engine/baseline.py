from typing import List, Dict, Tuple, Any
from backend.core.models import (
    ProductSKU, NetworkNode, InventoryBatch, TransportRoute,
    DemandForecast, NodeType
)

class TraditionalBaselineEngine:
    """
    Simulates standard legacy FMCG distribution practices:
    - Siloed single-source allocation (nearest regional depot only, no dynamic network pooling)
    - FIFO / Blind batch picking (no FEFO shelf-life optimization)
    - High stockout vulnerability during regional surges
    - Higher spoilage and write-off losses
    """

    def __init__(
        self,
        products: List[ProductSKU],
        nodes: List[NetworkNode],
        batches: List[InventoryBatch],
        routes: List[TransportRoute],
        forecasts: List[DemandForecast]
    ):
        self.products_map = {p.sku: p for p in products}
        self.nodes_map = {n.id: n for n in nodes}
        self.batches = [b.model_copy() for b in batches]
        self.routes_map = {(r.origin_id, r.destination_id): r for r in routes}
        self.forecasts = [f.model_copy() for f in forecasts]

    def evaluate(self, demand_multiplier: float = 1.0) -> Dict[str, Any]:
        # Track batches with simple FIFO picking
        batch_pool = {b.batch_id: b.model_copy() for b in self.batches}

        # Destination to nearest warehouse mapping
        nearest_wh_map = {}
        for dest_id, dest_node in self.nodes_map.items():
            if dest_node.type in [NodeType.DARK_STORE, NodeType.RETAIL_SUPERMARKET, NodeType.GENERAL_TRADE]:
                # Find closest warehouse
                closest_wh = None
                min_dist = float("inf")
                for orig_id, orig_node in self.nodes_map.items():
                    if orig_node.type in [NodeType.CWH, NodeType.RDC]:
                        route = self.routes_map.get((orig_id, dest_id))
                        if route and route.distance_km < min_dist:
                            min_dist = route.distance_km
                            closest_wh = orig_id
                nearest_wh_map[dest_id] = closest_wh

        total_demand = 0
        fulfilled_units = 0
        unmet_units = 0
        total_freight = 0.0
        total_carbon = 0.0

        for f in self.forecasts:
            scaled_need = int(f.net_requirement * demand_multiplier)
            total_demand += scaled_need
            needed = scaled_need

            assigned_wh = nearest_wh_map.get(f.destination_id)
            sku_info = self.products_map.get(f.sku)
            if not assigned_wh or not sku_info:
                unmet_units += needed
                continue

            # Traditional policy: Only look in assigned_wh, ignore other warehouses
            # Pick batches with FIFO (mfg_date ascending) without checking if near-expiry
            wh_batches = [
                b for b in batch_pool.values()
                if b.warehouse_id == assigned_wh and b.sku == f.sku and b.units_available > 0
            ]
            wh_batches.sort(key=lambda b: b.mfg_date)

            route = self.routes_map.get((assigned_wh, f.destination_id))

            for b in wh_batches:
                if needed <= 0:
                    break
                alloc = min(needed, b.units_available)
                b.units_available -= alloc
                needed -= alloc
                fulfilled_units += alloc

                if route:
                    rate = route.freight_rate_per_kg * 1.15  # Unoptimized spot freight
                    cost = alloc * sku_info.weight_kg * rate
                    total_freight += cost
                    ton_km = (alloc * sku_info.weight_kg / 1000.0) * route.distance_km
                    total_carbon += ton_km * route.carbon_factor_kg_ton_km

            unmet_units += needed

        # In baseline, near-expiry batches (<25% shelf-life) left in warehouses expire and spoil
        spoilage_units = sum(
            b.units_available for b in batch_pool.values() if b.remaining_shelf_life_pct <= 25.0
        )
        avg_cost = 65.0
        spoilage_cost = round(spoilage_units * avg_cost, 2)

        stockout_rate = round((unmet_units / max(1, total_demand)) * 100.0, 2)
        fulfillment_rate = round(100.0 - stockout_rate, 2)

        return {
            "policy": "Legacy Rule-of-Thumb (Siloed Nearest-Depot FIFO)",
            "total_demand": total_demand,
            "fulfilled_units": fulfilled_units,
            "unmet_stockout_units": unmet_units,
            "stockout_rate_pct": stockout_rate,
            "fulfillment_rate_pct": fulfillment_rate,
            "total_freight_cost": round(total_freight, 2),
            "spoilage_wastage_units": spoilage_units,
            "spoilage_wastage_cost": spoilage_cost,
            "total_carbon_kg": round(total_carbon, 2),
            "fefo_compliance_pct": 58.4  # Legacy systems suffer poor FEFO tracking
        }
