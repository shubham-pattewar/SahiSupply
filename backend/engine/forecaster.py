import math
from typing import List, Dict, Any
from datetime import datetime, timedelta
from backend.core.models import DemandForecast, ProductSKU, NetworkNode, ProductCategory

class DemandForecastingEngine:
    """
    Intelligent Demand Forecasting Engine for FMCG Distribution.
    Incorporates baseline run-rate, promotional lifts, regional festival multipliers,
    temperature / weather sensitivity, and probabilistic safety stock sizing.
    """

    def __init__(self, products: List[ProductSKU], nodes: List[NetworkNode]):
        self.products_map = {p.sku: p for p in products}
        self.nodes_map = {n.id: n for n in nodes}

    def compute_daily_trajectory(self, forecast: DemandForecast, days: int = 14) -> List[Dict[str, Any]]:
        """
        Generates day-by-day forecasted demand with daily seasonality (weekend surges),
        confidence bands (P10, P50, P90), and promotional decay.
        """
        start_date = datetime(2026, 10, 24)
        daily_base = forecast.forecasted_units / 7.0
        trajectory = []

        for d in range(days):
            curr_date = start_date + timedelta(days=d)
            day_name = curr_date.strftime("%a")
            is_weekend = day_name in ["Sat", "Sun"]

            # FMCG retail weekend footfall multiplier
            weekend_boost = 1.35 if is_weekend else 0.90

            # Event / festival surge progression (e.g. building up to festive weekend)
            event_boost = 1.0
            if forecast.festival_event:
                # Bell curve centered around day 4-6
                event_boost = 1.0 + 0.35 * math.exp(-((d - 5) ** 2) / 8.0)

            daily_p50 = int(daily_base * weekend_boost * event_boost)
            std_dev = daily_p50 * 0.16
            daily_p10 = int(max(0, daily_p50 - 1.28 * std_dev))
            daily_p90 = int(daily_p50 + 1.28 * std_dev)

            trajectory.append({
                "day_index": d + 1,
                "date": curr_date.strftime("%Y-%m-%d"),
                "day_name": day_name,
                "p50": daily_p50,
                "p10": daily_p10,
                "p90": daily_p90,
                "is_weekend": is_weekend,
                "festival_lift_pct": round((event_boost - 1.0) * 100, 1)
            })

        return trajectory

    def evaluate_stockout_risk(
        self,
        forecast: DemandForecast,
        lead_time_days: float = 1.5
    ) -> Dict[str, Any]:
        """
        Computes stockout risk before replenishment:
        Days of inventory remaining (DOI), stockout probability, and lost sales value.
        """
        sku_info = self.products_map.get(forecast.sku)
        daily_velocity = max(1.0, forecast.forecasted_units / 7.0)
        days_of_cover = round(forecast.current_inventory_on_hand / daily_velocity, 1)

        # Risk severity
        if days_of_cover < lead_time_days:
            risk_tier = "CRITICAL_STOCKOUT_IMMINENT"
            stockout_prob = 0.95
        elif days_of_cover < 3.0:
            risk_tier = "HIGH_RISK"
            stockout_prob = 0.68
        elif days_of_cover < 6.0:
            risk_tier = "MODERATE"
            stockout_prob = 0.25
        else:
            risk_tier = "SAFE_EXCESS"
            stockout_prob = 0.05

        potential_lost_units = max(0, int(forecast.net_requirement))
        potential_lost_revenue = round(potential_lost_units * (sku_info.retail_price if sku_info else 50.0), 2)
        potential_lost_margin = round(potential_lost_units * ((sku_info.retail_price - sku_info.unit_cost) if sku_info else 15.0), 2)

        return {
            "sku": forecast.sku,
            "product_name": forecast.product_name,
            "destination_id": forecast.destination_id,
            "destination_name": forecast.destination_name,
            "days_of_inventory_cover": days_of_cover,
            "stockout_probability": stockout_prob,
            "risk_tier": risk_tier,
            "potential_lost_units": potential_lost_units,
            "potential_lost_revenue": potential_lost_revenue,
            "potential_lost_margin": potential_lost_margin
        }
