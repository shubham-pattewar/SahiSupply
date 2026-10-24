import pytest
from fastapi.testclient import TestClient
from backend.app import app, state
from backend.engine.ml_forecaster import MLForecastingEngine
from backend.engine.ortools_optimizer import ORToolsDistributionOptimizer
from backend.engine.greedy_baseline import GreedyBaselineAllocationEngine
from backend.engine.constraint_checker import IndependentConstraintChecker

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "optimization_solver" in data
    assert "forecasting_models" in data
    assert "database" in data

def test_api_network_nodes():
    response = client.get("/api/network/nodes")
    assert response.status_code == 200
    data = response.json()
    assert len(data["cwhs"]) == 4
    assert len(data["rdcs"]) == 8
    assert len(data["destinations"]) == 16

def test_api_sections():
    response = client.get("/api/sections")
    assert response.status_code == 200
    sections = response.json()
    assert len(sections) == 3
    sec_ids = [s["id"] for s in sections]
    assert "Cosmetics" in sec_ids
    assert "Groceries" in sec_ids
    assert "Pharmaceuticals" in sec_ids

def test_api_products():
    response = client.get("/api/products")
    assert response.status_code == 200
    prods = response.json()
    assert len(prods) == 15
    categories = {p["category"] for p in prods}
    assert "Cosmetics" in categories
    assert "Groceries" in categories
    assert "Pharmaceuticals" in categories

def test_ml_forecasting_models():
    forecaster = state.ml_forecaster
    eval_result = forecaster.train_and_evaluate_models("DEST-MUM-QC", "SKU-GRO-01")
    assert "models" in eval_result
    assert "seasonal_naive" in eval_result["models"]
    assert "moving_average_7d" in eval_result["models"]
    assert "gradient_boosting" in eval_result["models"]

    models = eval_result["models"]
    for m in ["seasonal_naive", "moving_average_7d", "gradient_boosting"]:
        assert "mae" in models[m]
        assert "rmse" in models[m]
        assert "mape" in models[m]

def test_ortools_optimizer_and_constraints():
    optimizer = state.ortools_optimizer
    recs, metrics = optimizer.solve()
    assert len(recs) > 0
    assert metrics.fulfillment_rate_pct > 80.0
    assert metrics.fefo_compliance_pct == 100.0

    # Test Independent Constraint Checker
    checker = state.constraint_checker
    audit = checker.verify_all(recs)
    assert audit["is_valid"] is True
    assert audit["verification_score_pct"] == 100.0
    assert audit["checks"]["inventory_availability"]["passed"] is True
    assert audit["checks"]["shelf_life_feasibility"]["passed"] is True
    assert audit["checks"]["warehouse_throughput"]["passed"] is True
    assert audit["checks"]["packaging_multiples"]["passed"] is True
    assert audit["checks"]["demand_bounds"]["passed"] is True

def test_greedy_baseline_comparison():
    greedy = state.greedy_baseline
    baseline_res = greedy.solve()
    assert "stockout_rate_pct" in baseline_res
    assert "spoilage_wastage_units" in baseline_res
    assert baseline_res["stockout_rate_pct"] > state.current_metrics.stockout_rate_pct
