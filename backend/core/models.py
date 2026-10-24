from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ProductCategory(str, Enum):
    COSMETICS = "Cosmetics"
    GROCERIES = "Groceries"
    PHARMACEUTICALS = "Pharmaceuticals"

class NodeType(str, Enum):
    CWH = "Central Warehouse (Mother Hub)"
    RDC = "Regional Distribution Center"
    RETAIL_SUPERMARKET = "Modern Trade Supermarket"
    DARK_STORE = "Quick Commerce Dark Store"
    GENERAL_TRADE = "General Trade Kirana Hub"

class PriorityLevel(str, Enum):
    CRITICAL = "CRITICAL (Stockout Imminent)"
    URGENT = "URGENT (FEFO Expiry Salvage)"
    OPTIMAL = "OPTIMAL (Cycle Replenishment)"
    BUFFER = "BUFFER (Safety Stock Top-Up)"

class ProductSKU(BaseModel):
    sku: str
    name: str
    category: ProductCategory
    shelf_life_days: int
    min_retail_shelf_life_days: int
    unit_cost: float
    retail_price: float
    weight_kg: float
    cold_chain_required: bool = False
    unit_volume_m3: float = 0.002
    case_pack_qty: int = 12

class NetworkNode(BaseModel):
    id: str
    name: str
    type: NodeType
    city: str
    state: str
    lat: float
    lng: float
    storage_capacity_units: int
    current_occupancy_units: int
    daily_throughput_capacity: int
    contact_person: str = "Logistics Lead"

class InventoryBatch(BaseModel):
    batch_id: str
    sku: str
    product_name: str
    category: ProductCategory
    warehouse_id: str
    warehouse_name: str
    units_available: int
    mfg_date: str
    expiry_date: str
    days_to_expiry: int
    remaining_shelf_life_pct: float
    holding_cost_per_day: float
    cold_chain: bool
    status: str # "FRESH", "AGING", "CRITICAL_FEFO", "EXPIRED"

class TransportRoute(BaseModel):
    origin_id: str
    destination_id: str
    distance_km: float
    transit_lead_time_hours: float
    freight_rate_per_kg: float
    reefer_surcharge_pct: float = 0.25
    carbon_factor_kg_ton_km: float = 0.082

class DemandForecast(BaseModel):
    destination_id: str
    destination_name: str
    sku: str
    product_name: str
    category: ProductCategory
    base_demand: int
    forecasted_units: int
    p10_units: int
    p50_units: int
    p90_units: int
    safety_stock_required: int
    current_inventory_on_hand: int
    net_requirement: int
    promo_multiplier: float = 1.0
    festival_event: Optional[str] = None

class AllocationRecommendation(BaseModel):
    id: str
    origin_id: str
    origin_name: str
    destination_id: str
    destination_name: str
    sku: str
    product_name: str
    category: ProductCategory
    batch_id: str
    days_to_expiry: int
    remaining_shelf_life_pct: float
    quantity_units: int
    quantity_cases: int
    priority: PriorityLevel
    urgency_reason: str
    freight_cost: float
    lead_time_hours: float
    stockout_prevented_units: int
    expiry_risk_mitigated_units: int
    transport_mode: str # "Full Truckload (FTL)", "Less-than-Truckload (LTL)", "Cold-Chain Reefer Express"
    status: str = "Pending Approval"
    carbon_emission_kg: float = 0.0

class NetworkSummaryMetrics(BaseModel):
    total_network_demand: int
    total_allocated_units: int
    unmet_stockout_units: int
    stockout_rate_pct: float
    fulfillment_rate_pct: float
    total_freight_cost: float
    cost_per_unit_shipped: float
    inventory_at_risk_units: int
    wastage_prevented_units: int
    wastage_loss_saved_value: float
    fefo_compliance_pct: float
    total_carbon_emission_kg: float
    savings_vs_baseline_pct: float
    cost_saved_vs_baseline: float
    stockout_reduction_pct: float
    waste_reduction_pct: float

class SimulationScenario(BaseModel):
    scenario_id: str
    name: str
    description: str
    demand_multiplier: float = 1.0
    outage_warehouse_id: Optional[str] = None
    outage_capacity_reduction_pct: float = 0.0
    freight_rate_multiplier: float = 1.0
    cold_chain_cost_multiplier: float = 1.0
    shelf_life_degradation_days: int = 0
