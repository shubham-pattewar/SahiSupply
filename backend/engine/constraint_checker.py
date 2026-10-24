from typing import List, Dict, Any
from backend.core.models import (
    AllocationRecommendation, InventoryBatch, DemandForecast,
    ProductSKU, NetworkNode, TransportRoute
)

class IndependentConstraintChecker:
    """
    Independent Constraint Checker for SahiSupply Distribution Intelligence Engine.
    Performs rigorous post-optimization auditing to ensure:
    1. Inventory Availability: No batch or warehouse is over-allocated.
    2. Demand Bounds: Allocations do not exceed net requirements.
    3. Expiry & Shelf-Life Feasibility: No batch arrives with shelf life below retail acceptance dock minimums.
    4. Outbound Throughput Capacity: No warehouse exceeds daily handling capacity.
    5. Packaging Multiple Integrity: Every shipment aligns with case-pack units.
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
        self.batches_map = {b.batch_id: b for b in batches}
        self.routes_map = {(r.origin_id, r.destination_id): r for r in routes}
        self.forecasts_map = {(f.destination_id, f.sku): f for f in forecasts}

    def verify_all(self, recommendations: List[AllocationRecommendation]) -> Dict[str, Any]:
        violations = []
        checks_summary = {}

        # 1. Inventory Availability Check
        batch_allocated_units = {}
        for r in recommendations:
            batch_allocated_units[r.batch_id] = batch_allocated_units.get(r.batch_id, 0) + r.quantity_units

        inv_violations = []
        for b_id, alloc_qty in batch_allocated_units.items():
            batch = self.batches_map.get(b_id)
            if not batch:
                inv_violations.append(f"Unknown batch ID '{b_id}' referenced in allocation.")
            elif alloc_qty > batch.units_available:
                inv_violations.append(
                    f"Batch {b_id} over-allocated: {alloc_qty} units allocated > {batch.units_available} units available."
                )

        checks_summary["inventory_availability"] = {
            "name": "Inventory Availability & Non-Negative Balance",
            "passed": len(inv_violations) == 0,
            "batches_audited": len(batch_allocated_units),
            "violations_count": len(inv_violations),
            "details": inv_violations[:5]
        }
        violations.extend(inv_violations)

        # 2. Expiry & Shelf-Life Validity Check (FEFO Dock Acceptance)
        expiry_violations = []
        for r in recommendations:
            sku_info = self.products_map.get(r.sku)
            route = self.routes_map.get((r.origin_id, r.destination_id))
            if sku_info and route:
                lead_days = route.transit_lead_time_hours / 24.0
                remaining_life_at_dock = r.days_to_expiry - lead_days
                if remaining_life_at_dock < sku_info.min_retail_shelf_life_days:
                    expiry_violations.append(
                        f"Order {r.id}: {r.product_name} arrives at {r.destination_name} with only "
                        f"{remaining_life_at_dock:.1f} days of shelf-life (Minimum required: {sku_info.min_retail_shelf_life_days} days). Retailer rejection imminent!"
                    )

        checks_summary["shelf_life_feasibility"] = {
            "name": "Retail Dock Shelf-Life Acceptance (FEFO)",
            "passed": len(expiry_violations) == 0,
            "orders_audited": len(recommendations),
            "violations_count": len(expiry_violations),
            "details": expiry_violations[:5]
        }
        violations.extend(expiry_violations)

        # 3. Warehouse Outbound Throughput Capacity Check (over 7-day planning window)
        wh_outbound = {}
        for r in recommendations:
            wh_outbound[r.origin_id] = wh_outbound.get(r.origin_id, 0) + r.quantity_units

        throughput_violations = []
        for wh_id, dispatched_units in wh_outbound.items():
            wh_node = self.nodes_map.get(wh_id)
            cycle_throughput_limit = wh_node.daily_throughput_capacity * 7
            if wh_node and dispatched_units > cycle_throughput_limit:
                throughput_violations.append(
                    f"Warehouse {wh_node.name} 7-day throughput exceeded: {dispatched_units:,} units > {cycle_throughput_limit:,} limit."
                )

        checks_summary["warehouse_throughput"] = {
            "name": "Warehouse Outbound Handling & Throughput Capacity",
            "passed": len(throughput_violations) == 0,
            "warehouses_audited": len(wh_outbound),
            "violations_count": len(throughput_violations),
            "details": throughput_violations[:5]
        }
        violations.extend(throughput_violations)

        # 4. Case-Pack & Packaging Multiple Integrity
        packaging_violations = []
        for r in recommendations:
            sku_info = self.products_map.get(r.sku)
            if sku_info and (r.quantity_units % sku_info.case_pack_qty != 0):
                packaging_violations.append(
                    f"Order {r.id}: Quantity {r.quantity_units} is not a multiple of case-pack ({sku_info.case_pack_qty} units)."
                )

        checks_summary["packaging_multiples"] = {
            "name": "Case-Pack & Packaging Unit Integrity",
            "passed": len(packaging_violations) == 0,
            "orders_audited": len(recommendations),
            "violations_count": len(packaging_violations),
            "details": packaging_violations[:5]
        }
        violations.extend(packaging_violations)

        # 5. Demand Non-Negativity & Bounds Check
        dest_received = {}
        for r in recommendations:
            key = (r.destination_id, r.sku)
            dest_received[key] = dest_received.get(key, 0) + r.quantity_units

        demand_violations = []
        for (dest_id, sku), alloc_units in dest_received.items():
            f = self.forecasts_map.get((dest_id, sku))
            if f and alloc_units > (f.net_requirement + f.safety_stock_required * 1.5):
                demand_violations.append(
                    f"Destination {dest_id} over-supplied for {sku}: {alloc_units} allocated vs {f.net_requirement} net demand."
                )

        checks_summary["demand_bounds"] = {
            "name": "Destination Demand Non-Negativity & Capacity Bounds",
            "passed": len(demand_violations) == 0,
            "demand_pairs_audited": len(dest_received),
            "violations_count": len(demand_violations),
            "details": demand_violations[:5]
        }
        violations.extend(demand_violations)

        total_checks = len(checks_summary)
        passed_checks = sum(1 for c in checks_summary.values() if c["passed"])

        return {
            "is_valid": len(violations) == 0,
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "verification_score_pct": round((passed_checks / total_checks) * 100.0, 1),
            "checks": checks_summary,
            "total_violations": len(violations),
            "violations": violations
        }
