export interface NetworkNode {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  lat: float;
  lng: float;
  storage_capacity_units: number;
  current_occupancy_units: number;
  daily_throughput_capacity: number;
  contact_person?: string;
}

export type float = number;

export interface ProductSKU {
  sku: string;
  name: string;
  category: string;
  shelf_life_days: number;
  min_retail_shelf_life_days: number;
  unit_cost: number;
  retail_price: number;
  weight_kg: number;
  cold_chain_required: boolean;
  unit_volume_m3: number;
  case_pack_qty: number;
}

export interface InventoryBatch {
  batch_id: string;
  sku: string;
  product_name: string;
  category: string;
  warehouse_id: string;
  warehouse_name: string;
  units_available: number;
  mfg_date: string;
  expiry_date: string;
  days_to_expiry: number;
  remaining_shelf_life_pct: number;
  holding_cost_per_day: number;
  cold_chain: boolean;
  status: string;
}

export interface DemandForecast {
  destination_id: string;
  destination_name: string;
  sku: string;
  product_name: string;
  category: string;
  base_demand: number;
  forecasted_units: number;
  p10_units: number;
  p50_units: number;
  p90_units: number;
  safety_stock_required: number;
  current_inventory_on_hand: number;
  net_requirement: number;
  promo_multiplier: number;
  festival_event?: string;
}

export interface AllocationRecommendation {
  id: string;
  origin_id: string;
  origin_name: string;
  destination_id: string;
  destination_name: string;
  sku: string;
  product_name: string;
  category: string;
  batch_id: string;
  days_to_expiry: number;
  remaining_shelf_life_pct: number;
  quantity_units: number;
  quantity_cases: number;
  priority: string;
  urgency_reason: string;
  freight_cost: number;
  lead_time_hours: number;
  stockout_prevented_units: number;
  expiry_risk_mitigated_units: number;
  transport_mode: string;
  status: string;
  carbon_emission_kg: number;
}

export interface NetworkSummaryMetrics {
  total_network_demand: number;
  total_allocated_units: number;
  unmet_stockout_units: number;
  stockout_rate_pct: number;
  fulfillment_rate_pct: number;
  total_freight_cost: number;
  cost_per_unit_shipped: number;
  inventory_at_risk_units: number;
  wastage_prevented_units: number;
  wastage_loss_saved_value: number;
  fefo_compliance_pct: number;
  total_carbon_emission_kg: number;
  savings_vs_baseline_pct: number;
  cost_saved_vs_baseline: number;
  stockout_reduction_pct: number;
  waste_reduction_pct: number;
}

export interface ConstraintAudit {
  is_valid: boolean;
  total_checks: number;
  passed_checks: number;
  verification_score_pct: number;
  total_violations: number;
  violations: string[];
  checks: {
    [key: string]: {
      name: string;
      passed: boolean;
      violations_count: number;
      details: string[];
    };
  };
}

export interface BenchmarkComparison {
  sahi_supply_ai: NetworkSummaryMetrics;
  greedy_baseline: {
    policy: string;
    total_demand: number;
    fulfilled_units: number;
    unmet_stockout_units: number;
    stockout_rate_pct: number;
    fulfillment_rate_pct: number;
    total_freight_cost: number;
    spoilage_wastage_units: number;
    spoilage_wastage_cost: number;
    total_carbon_kg: number;
    fefo_compliance_pct: number;
  };
  improvements: {
    stockout_reduction_pct: number;
    waste_reduction_pct: number;
    cost_saved: number;
    savings_pct: number;
    carbon_reduction_kg: number;
  };
}

export interface TrajectoryPoint {
  day_index: number;
  date: string;
  day_name: string;
  p50_gradient_boosting: number;
  p10: number;
  p90: number;
  seasonal_naive: number;
  moving_average: number;
  is_weekend: number;
  festival_lift_pct: number;
}

export interface ForwardForecastResponse {
  forecast: DemandForecast;
  forward_forecast: {
    destination_id: string;
    destination_name: string;
    sku: string;
    product_name: string;
    category: string;
    horizon_days: number;
    cumulative_forecast_p50: number;
    safety_stock_required: number;
    current_inventory: number;
    net_requirement: number;
    trajectory: TrajectoryPoint[];
  };
  models_evaluation: {
    destination_id: string;
    sku: string;
    best_model: string;
    models: {
      [key: string]: {
        mae: number;
        rmse: number;
        mape: number;
      };
    };
  };
}

export type SectionType = 'All' | 'Cosmetics' | 'Groceries' | 'Pharmaceuticals';

export interface SectionMetadata {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  description: string;
  sku_count: number;
  cold_chain_required: boolean;
  characteristics: string[];
}

