from typing import List, Dict, Any, Optional
from backend.core.models import (
    AllocationRecommendation, NetworkSummaryMetrics, NetworkNode, ProductSKU
)

class SupplyChainCopilotEngine:
    """
    Intelligent AI Supply Chain Copilot.
    Provides natural language explanations, executive summaries, and answers queries
    about routing decisions, FEFO prioritization, and network bottlenecks.
    """

    def __init__(
        self,
        products: List[ProductSKU],
        nodes: List[NetworkNode]
    ):
        self.products_map = {p.sku: p for p in products}
        self.nodes_map = {n.id: n for n in nodes}

    def generate_executive_summary(
        self,
        metrics: NetworkSummaryMetrics,
        recommendations: List[AllocationRecommendation],
        baseline_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates an executive-level operational briefing with key highlights,
        financial impacts, and critical interventions.
        """
        top_salvage = [r for r in recommendations if r.expiry_risk_mitigated_units > 0]
        top_stockout_preventions = [r for r in recommendations if "CRITICAL" in r.priority.value]

        return {
            "headline": f"Optimization Completed: {metrics.fulfillment_rate_pct}% Network Fulfillment Achieved",
            "executive_takeaways": [
                f"**Stockout Risk Slashed by {metrics.stockout_reduction_pct}%**: Unmet demand reduced from {baseline_metrics['stockout_rate_pct']}% (legacy policy) down to {metrics.stockout_rate_pct}%.",
                f"**FEFO Expiry Salvage**: {metrics.wastage_prevented_units:,} units of aging inventory successfully diverted to high-velocity urban dark stores, saving ₹{metrics.wastage_loss_saved_value:,.2f} in spoilage write-offs.",
                f"**Logistics Efficiency**: Freight spend optimized to ₹{metrics.total_freight_cost:,.2f} (₹{metrics.cost_per_unit_shipped:.2f}/unit) with FTL consolidation, reducing transport CO2 by {metrics.total_carbon_emission_kg:,.1f} kg.",
                f"**Total Network Savings**: ₹{metrics.cost_saved_vs_baseline:,.2f} net cost reduction ({metrics.savings_vs_baseline_pct}% improvement over legacy single-depot FIFO)."
            ],
            "critical_actions_required": [
                f"Approve {len(top_stockout_preventions)} high-priority emergency dispatches to prevent stockouts in festive retail zones.",
                f"Authorize cold-chain reefer fleet dispatches for {len([r for r in recommendations if 'Cold-Chain' in r.transport_mode])} dairy and beverage consignments.",
                f"Review {len(top_salvage)} FEFO salvage allocations departing within the next 6 hours."
            ]
        }

    def answer_query(
        self,
        query: str,
        recommendations: List[AllocationRecommendation],
        metrics: NetworkSummaryMetrics,
        baseline_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Answers natural language queries regarding the distribution intelligence engine.
        """
        q = query.lower()

        # Query 1: Why FEFO / Spoilage
        if any(term in q for term in ["fefo", "expiry", "spoilage", "waste", "aging"]):
            salvage_recs = [r for r in recommendations if r.expiry_risk_mitigated_units > 0]
            sample = salvage_recs[0] if salvage_recs else None
            return {
                "category": "FEFO & Shelf-Life Salvage",
                "answer": (
                    f"The engine dynamically prioritizes batches nearing the retail acceptance threshold. "
                    f"Across the network, **{metrics.wastage_prevented_units:,} units** were identified with <28% remaining shelf life. "
                    f"Instead of letting them languish in central warehouses until expiration, the engine routed them to high-turnover "
                    f"nodes (such as 10-minute Quick Commerce Dark Stores in Mumbai and Bengaluru), where consumer turnover occurs in under 48 hours. "
                    + (f"For example, batch **{sample.batch_id}** ({sample.product_name}) with only {sample.days_to_expiry} days left was routed from {sample.origin_name} to {sample.destination_name} to avoid an estimated loss of ₹{sample.expiry_risk_mitigated_units * 65:,}." if sample else "")
                ),
                "metric_highlight": f"Saved ₹{metrics.wastage_loss_saved_value:,.2f} from dump waste"
            }

        # Query 2: Savings vs Baseline / ROI
        elif any(term in q for term in ["saving", "roi", "baseline", "compare", "legacy", "improve"]):
            return {
                "category": "ROI & Efficiency Benchmark",
                "answer": (
                    f"Compared to traditional siloed replenishment (which relies on single-depot assignment and blind FIFO picking), "
                    f"SahiSupply AI delivers **₹{metrics.cost_saved_vs_baseline:,.2f} in net operational savings** ({metrics.savings_vs_baseline_pct}% overall savings). "
                    f"This consists of: \n"
                    f"1. **{metrics.stockout_reduction_pct}% lower stockout rate** through intelligent multi-hub pooling.\n"
                    f"2. **{metrics.waste_reduction_pct}% reduction in expired product wastage** via proactive FEFO allocation.\n"
                    f"3. **Freight consolidation**: bundling consignments into Full Truckloads (FTL) to lower per-unit freight to ₹{metrics.cost_per_unit_shipped:.2f}."
                ),
                "metric_highlight": f"₹{metrics.cost_saved_vs_baseline:,.2f} Total Savings"
            }

        # Query 3: Stockout and Fulfillment
        elif any(term in q for term in ["stockout", "fulfillment", "fill rate", "otif", "shortage"]):
            return {
                "category": "Fulfillment & Stockout Mitigation",
                "answer": (
                    f"Network fulfillment rate is currently at **{metrics.fulfillment_rate_pct}%** with only {metrics.unmet_stockout_units:,} units unmet ({metrics.stockout_rate_pct}% stockout rate). "
                    f"The engine evaluated all regional stock balances and executed cross-hub transfers where local depot stock was depleted, "
                    f"preventing stockouts in major metro clusters during festive demand peaks."
                ),
                "metric_highlight": f"{metrics.fulfillment_rate_pct}% Order Fulfillment Rate"
            }

        # Query 4: Cold chain or dairy
        elif any(term in q for term in ["cold", "dairy", "reefer", "chilled", "temperature"]):
            cold_recs = [r for r in recommendations if "Cold-Chain" in r.transport_mode]
            total_cold_units = sum(r.quantity_units for r in cold_recs)
            return {
                "category": "Cold-Chain & Fresh Goods Logistics",
                "answer": (
                    f"The engine flagged {len(cold_recs)} shipments requiring dedicated temperature-controlled Reefer transport, "
                    f"representing **{total_cold_units:,} units** of ultra-fresh paneer, Greek yogurt, and cold-pressed juices. "
                    f"These routes incorporate strict 2-8°C transit constraints and accelerated transit schedules to preserve shelf life."
                ),
                "metric_highlight": f"{len(cold_recs)} Reefer Express Dispatches"
            }

        # Default Fallback Query
        else:
            return {
                "category": "Operational Intelligence",
                "answer": (
                    f"SahiSupply AI is currently managing **{len(recommendations)} active allocation directives** "
                    f"across 4 Central Warehouses, 8 RDCs, and 16 Retail/Dark Store clusters. "
                    f"Network-wide demand of {metrics.total_network_demand:,} units is being fulfilled at {metrics.fulfillment_rate_pct}% efficiency, "
                    f"with full FEFO compliance and ₹{metrics.cost_saved_vs_baseline:,.2f} in quantified supply chain savings."
                ),
                "metric_highlight": f"{len(recommendations)} Optimized Shipments"
            }
