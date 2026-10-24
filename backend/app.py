import os
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.core.models import (
    ProductCategory, NodeType, ProductSKU, NetworkNode,
    InventoryBatch, TransportRoute, DemandForecast,
    AllocationRecommendation, NetworkSummaryMetrics, SimulationScenario
)
from backend.db.mongo import mongo_manager
from backend.db.seed import seed_database
from backend.engine.generator import (
    build_products, build_network_nodes, build_transport_routes,
    generate_inventory_batches, generate_demand_forecasts
)
from backend.engine.ml_forecaster import MLForecastingEngine
from backend.engine.ortools_optimizer import ORToolsDistributionOptimizer
from backend.engine.greedy_baseline import GreedyBaselineAllocationEngine
from backend.engine.constraint_checker import IndependentConstraintChecker
from backend.engine.copilot import SupplyChainCopilotEngine

# Initialize FastAPI App
app = FastAPI(
    title="SahiSupply AI — Enterprise Distribution Intelligence Engine",
    description="Multi-echelon FMCG inventory allocation powered by Google OR-Tools, scikit-learn forecasting, MongoDB, and Independent Constraint Verification.",
    version="3.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EnterpriseSupplyChainState:
    """
    Application State Coordinator connecting MongoDB, Google OR-Tools,
    ML Forecaster, and Independent Constraint Checker.
    """
    def __init__(self):
        # 1. Initialize & Seed MongoDB if empty
        if mongo_manager.warehouses.count_documents({}) == 0:
            seed_database()

        # 2. Load entities from MongoDB
        self.products = [ProductSKU(**doc) for doc in mongo_manager.products.find({}, {"_id": 0})]
        raw_whs = [NetworkNode(**doc) for doc in mongo_manager.warehouses.find({}, {"_id": 0})]
        raw_dests = [NetworkNode(**doc) for doc in mongo_manager.destinations.find({}, {"_id": 0})]

        self.cwhs = [w for w in raw_whs if w.type == NodeType.CWH]
        self.rdcs = [w for w in raw_whs if w.type == NodeType.RDC]
        self.destinations = raw_dests
        self.all_nodes = raw_whs + raw_dests

        self.routes = [TransportRoute(**doc) for doc in mongo_manager.routes.find({}, {"_id": 0})]
        self.batches = [InventoryBatch(**doc) for doc in mongo_manager.batches.find({}, {"_id": 0})]
        self.demand_history = list(mongo_manager.demand_history.find({}, {"_id": 0}))

        # Generate active forecasts
        self.forecasts = generate_demand_forecasts(self.destinations, self.products)

        # 3. Engines Initialization
        self.ml_forecaster = MLForecastingEngine(self.demand_history)
        self.ortools_optimizer = ORToolsDistributionOptimizer(
            self.products, self.all_nodes, self.batches, self.routes, self.forecasts
        )
        self.greedy_baseline = GreedyBaselineAllocationEngine(
            self.products, self.all_nodes, self.batches, self.routes, self.forecasts
        )
        self.constraint_checker = IndependentConstraintChecker(
            self.products, self.all_nodes, self.batches, self.routes, self.forecasts
        )
        self.copilot = SupplyChainCopilotEngine(self.products, self.all_nodes)

        # 4. Compute Initial OR-Tools Optimal Plan & Audit
        self.current_recommendations, self.current_metrics = self.ortools_optimizer.solve()
        self.baseline_results = self.greedy_baseline.solve()
        self.current_audit = self.constraint_checker.verify_all(self.current_recommendations)

    def reset_to_defaults(self):
        self.__init__()

state = EnterpriseSupplyChainState()

# REST API Endpoints
@app.get("/api/health")
def health():
    return {
        "status": "online",
        "service": "SahiSupply AI Distribution Intelligence Engine",
        "database": {
            "is_mock": mongo_manager.is_mock,
            "engine": "In-Memory mongomock" if mongo_manager.is_mock else "Live MongoDB",
            "warehouses_count": mongo_manager.warehouses.count_documents({}),
            "destinations_count": mongo_manager.destinations.count_documents({}),
            "products_count": mongo_manager.products.count_documents({}),
            "batches_count": mongo_manager.batches.count_documents({}),
            "demand_history_records": mongo_manager.demand_history.count_documents({})
        },
        "optimization_solver": "Google OR-Tools Mixed-Integer Programming (SCIP/CBC)",
        "forecasting_models": ["Seasonal-Naive", "Moving-Average", "Gradient Boosting (scikit-learn)"],
        "constraint_checker": "Independent Constraint Verification Active"
    }

@app.get("/api/database/status")
def database_status():
    return {
        "connected": True,
        "is_mock": mongo_manager.is_mock,
        "db_name": mongo_manager.db_name,
        "collections": {
            "warehouses": mongo_manager.warehouses.count_documents({}),
            "destinations": mongo_manager.destinations.count_documents({}),
            "products": mongo_manager.products.count_documents({}),
            "batches": mongo_manager.batches.count_documents({}),
            "routes": mongo_manager.routes.count_documents({}),
            "demand_history": mongo_manager.demand_history.count_documents({})
        }
    }

@app.post("/api/database/seed")
def trigger_seed():
    res = seed_database()
    state.reset_to_defaults()
    return {"status": "success", "result": res}

@app.get("/api/network/nodes")
def get_network_nodes():
    return {
        "cwhs": [n.model_dump() for n in state.cwhs],
        "rdcs": [n.model_dump() for n in state.rdcs],
        "destinations": [n.model_dump() for n in state.destinations]
    }

@app.get("/api/products")
def get_products():
    return [p.model_dump() for p in state.products]

@app.get("/api/inventory/batches")
def get_inventory_batches(warehouse_id: Optional[str] = None, sku: Optional[str] = None):
    results = state.batches
    if warehouse_id:
        results = [b for b in results if b.warehouse_id == warehouse_id]
    if sku:
        results = [b for b in results if b.sku == sku]
    return [b.model_dump() for b in results]

@app.get("/api/demand/forecasts")
def get_demand_forecasts():
    return [f.model_dump() for f in state.forecasts]

@app.get("/api/forecasting/models-evaluation")
def evaluate_forecasting_models(destination_id: Optional[str] = None, sku: Optional[str] = None):
    target_dest = destination_id or state.destinations[0].id
    target_sku = sku or state.products[0].sku
    return state.ml_forecaster.train_and_evaluate_models(target_dest, target_sku)

@app.get("/api/demand/trajectory/{destination_id}/{sku}")
def get_demand_trajectory(destination_id: str, sku: str):
    f = next((x for x in state.forecasts if x.destination_id == destination_id and x.sku == sku), None)
    if not f:
        raise HTTPException(status_code=404, detail="Demand forecast not found for destination and SKU")
    
    forward_forecast = state.ml_forecaster.generate_forward_forecast(f, days=14)
    model_eval = state.ml_forecaster.train_and_evaluate_models(destination_id, sku)

    return {
        "forecast": f.model_dump(),
        "forward_forecast": forward_forecast,
        "models_evaluation": model_eval
    }

@app.get("/api/distribution/recommendations")
def get_distribution_recommendations(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    origin_id: Optional[str] = None,
    destination_id: Optional[str] = None
):
    recs = state.current_recommendations
    if category:
        recs = [r for r in recs if r.category.value == category]
    if priority:
        recs = [r for r in recs if r.priority.value == priority]
    if origin_id:
        recs = [r for r in recs if r.origin_id == origin_id]
    if destination_id:
        recs = [r for r in recs if r.destination_id == destination_id]
    return [r.model_dump() for r in recs]

@app.get("/api/distribution/metrics")
def get_distribution_metrics():
    return state.current_metrics.model_dump()

@app.get("/api/optimization/audit")
def audit_constraints():
    """
    Independent Constraint Checker endpoint.
    Verifies inventory limits, demand fulfillment, FEFO shelf life, throughput, and packaging multiples.
    """
    audit = state.constraint_checker.verify_all(state.current_recommendations)
    return audit

@app.get("/api/benchmark/comparison")
def get_benchmark_comparison():
    ai = state.current_metrics.model_dump()
    base = state.baseline_results
    return {
        "sahi_supply_ai": ai,
        "greedy_baseline": base,
        "improvements": {
            "stockout_reduction_pct": ai["stockout_reduction_pct"],
            "waste_reduction_pct": ai["waste_reduction_pct"],
            "cost_saved": ai["cost_saved_vs_baseline"],
            "savings_pct": ai["savings_vs_baseline_pct"],
            "carbon_reduction_kg": round(base["total_carbon_kg"] - ai["total_carbon_emission_kg"], 1)
        }
    }

@app.post("/api/simulation/run")
def run_simulation(scenario: SimulationScenario):
    """
    Executes what-if scenario simulation using Google OR-Tools Mixed-Integer solver:
    Demand shocks, warehouse disruptions, freight shocks, and shelf-life transit degradation.
    """
    recs, metrics = state.ortools_optimizer.solve(
        demand_multiplier=scenario.demand_multiplier,
        outage_warehouse_id=scenario.outage_warehouse_id,
        outage_capacity_reduction_pct=scenario.outage_capacity_reduction_pct,
        freight_rate_multiplier=scenario.freight_rate_multiplier,
        cold_chain_cost_multiplier=scenario.cold_chain_cost_multiplier,
        shelf_life_degradation_days=scenario.shelf_life_degradation_days
    )
    base_res = state.greedy_baseline.solve(demand_multiplier=scenario.demand_multiplier)
    audit = state.constraint_checker.verify_all(recs)

    state.current_recommendations = recs
    state.current_metrics = metrics
    state.baseline_results = base_res
    state.current_audit = audit

    return {
        "status": "success",
        "scenario": scenario.model_dump(),
        "metrics": metrics.model_dump(),
        "recommendations_count": len(recs),
        "audit": audit,
        "baseline_comparison": {
            "sahi_supply_ai": metrics.model_dump(),
            "greedy_baseline": base_res
        }
    }

@app.post("/api/simulation/reset")
def reset_simulation():
    state.reset_to_defaults()
    return {"status": "success", "message": "Optimal network state restored via Google OR-Tools."}

@app.post("/api/recommendations/{recommendation_id}/approve")
def approve_recommendation(recommendation_id: str):
    rec = next((r for r in state.current_recommendations if r.id == recommendation_id), None)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "Approved & Dispatched"
    return {"status": "success", "recommendation": rec.model_dump()}

@app.post("/api/recommendations/batch-approve")
def batch_approve_recommendations():
    count = 0
    for r in state.current_recommendations:
        if r.status == "Pending Approval":
            r.status = "Approved & Dispatched"
            count += 1
    return {"status": "success", "approved_count": count}

@app.post("/api/copilot/chat")
def copilot_chat(payload: Dict[str, str] = Body(...)):
    query = payload.get("query", "")
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    response = state.copilot.answer_query(
        query=query,
        recommendations=state.current_recommendations,
        metrics=state.current_metrics,
        baseline_metrics=state.baseline_results
    )
@app.get("/api/copilot/briefing")
def copilot_briefing():
    return state.copilot.generate_executive_summary(
        metrics=state.current_metrics,
        recommendations=state.current_recommendations,
        baseline_metrics=state.baseline_results
    )

# Static file serving for React Frontend Production Bundle
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

@app.get("/")
def serve_index():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "SahiSupply AI API is running. Visit /docs for Swagger API documentation."}

@app.get("/{full_path:path}")
def catch_all(full_path: str):
    # Route all non-API requests to index.html for client-side routing
    if not full_path.startswith("api"):
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Not Found")

