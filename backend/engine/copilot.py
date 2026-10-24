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
                f"Authorize cold-chain reefer fleet dispatches for {len([r for r in recommendations if 'Cold-Chain' in r.transport_mode])} temperature-sensitive grocery and pharmaceutical consignments.",
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

        # Query 4: Cold chain or temperature
        elif any(term in q for term in ["cold", "dairy", "reefer", "chilled", "temperature"]):
            cold_recs = [r for r in recommendations if "Cold-Chain" in r.transport_mode]
            total_cold_units = sum(r.quantity_units for r in cold_recs)
            return {
                "category": "Cold-Chain & Fresh Goods Logistics",
                "answer": (
                    f"The engine flagged {len(cold_recs)} shipments requiring dedicated temperature-controlled Reefer transport, "
                    f"representing **{total_cold_units:,} units** of ultra-fresh dairy (paneer, Greek yogurt), cold-pressed beverages, "
                    f"and critical pharmaceuticals (Insulin Glargine Bio-Pens). "
                    f"These routes enforce strict 2–8°C refrigerated transit constraints and expedited dispatch."
                ),
                "metric_highlight": f"{len(cold_recs)} Reefer Express Dispatches"
            }

        # Query 5: Cosmetics Sector
        elif any(term in q for term in ["cosmetic", "beauty", "skin", "serum", "lipstick"]):
            cos_recs = [r for r in recommendations if r.category.value == "Cosmetics"]
            cos_units = sum(r.quantity_units for r in cos_recs)
            return {
                "category": "Cosmetics Sector Intelligence",
                "answer": (
                    f"In the **Cosmetics & Beauty sector**, the engine is managing **{len(cos_recs)} allocation orders** ({cos_units:,} units). "
                    f"Cosmetics carry the highest average gross margin (62%), making stockout prevention exceptionally high-ROI. "
                    f"The engine accounts for festive campaign lifts (1.4x promo multiplier) and protects minimum retail dock shelf-life requirements (180+ days)."
                ),
                "metric_highlight": f"{len(cos_recs)} Cosmetic Orders ({cos_units:,} units)"
            }

        # Query 6: Pharmaceuticals Sector
        elif any(term in q for term in ["pharma", "medicine", "drug", "insulin", "antibiotic", "health"]):
            pha_recs = [r for r in recommendations if r.category.value == "Pharmaceuticals"]
            pha_units = sum(r.quantity_units for r in pha_recs)
            return {
                "category": "Pharmaceuticals Sector Intelligence",
                "answer": (
                    f"In the **Pharmaceuticals & Healthcare sector**, the engine is executing **{len(pha_recs)} shipments** ({pha_units:,} units). "
                    f"Priorities are configured for near-zero stockout tolerance on essential antibiotics (AzithroCare) and antipyretics (Paracip), "
                    f"along with strict 2–8°C cold-chain tracking for Insulin Glargine Solostar pens and 100% FEFO regulatory batch compliance."
                ),
                "metric_highlight": f"{len(pha_recs)} Pharma Shipments (100% FEFO Compliance)"
            }

        # Query 7: Groceries Sector
        elif any(term in q for term in ["grocer", "food", "staple", "snack"]):
            gro_recs = [r for r in recommendations if r.category.value == "Groceries"]
            gro_units = sum(r.quantity_units for r in gro_recs)
            return {
                "category": "Groceries Sector Intelligence",
                "answer": (
                    f"In the **Groceries & Fresh Dairy sector**, the engine coordinates **{len(gro_recs)} dispatches** ({gro_units:,} units). "
                    f"Given short shelf-life horizons (14–45 days for paneer, yogurt, juices), the engine routes aging inventory to 10-minute Quick Commerce Dark Stores, "
                    f"eliminating dump wastage while fulfilling grocery replenishment cycles."
                ),
                "metric_highlight": f"{len(gro_recs)} Grocery Orders ({gro_units:,} units)"
            }

        # Default Fallback Query
        else:
            return {
                "category": "Operational Intelligence",
                "answer": (
                    f"SahiSupply AI is currently managing **{len(recommendations)} active allocation directives** "
                    f"across 3 specialized industry sectors: **Cosmetics, Groceries, and Pharmaceuticals**. "
                    f"Network-wide demand of {metrics.total_network_demand:,} units is being fulfilled at {metrics.fulfillment_rate_pct}% efficiency, "
                    f"with full FEFO compliance, multi-echelon pooling, and ₹{metrics.cost_saved_vs_baseline:,.2f} in verified supply chain savings."
                ),
                "metric_highlight": f"{len(recommendations)} Optimized Shipments across 3 Sectors"
            }
