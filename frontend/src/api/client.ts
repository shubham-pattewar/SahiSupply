import {
  NetworkNode, ProductSKU, InventoryBatch, DemandForecast,
  AllocationRecommendation, NetworkSummaryMetrics, ConstraintAudit,
  BenchmarkComparison, ForwardForecastResponse
} from '../types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchDatabaseStatus() {
  const res = await fetch(`${API_BASE}/database/status`);
  return res.json();
}

export async function fetchNetworkNodes(): Promise<{
  cwhs: NetworkNode[];
  rdcs: NetworkNode[];
  destinations: NetworkNode[];
}> {
  const res = await fetch(`${API_BASE}/network/nodes`);
  return res.json();
}

export async function fetchProducts(): Promise<ProductSKU[]> {
  const res = await fetch(`${API_BASE}/products`);
  return res.json();
}

export async function fetchInventoryBatches(): Promise<InventoryBatch[]> {
  const res = await fetch(`${API_BASE}/inventory/batches`);
  return res.json();
}

export async function fetchRecommendations(): Promise<AllocationRecommendation[]> {
  const res = await fetch(`${API_BASE}/distribution/recommendations`);
  return res.json();
}

export async function fetchMetrics(): Promise<NetworkSummaryMetrics> {
  const res = await fetch(`${API_BASE}/distribution/metrics`);
  return res.json();
}

export async function fetchBenchmark(): Promise<BenchmarkComparison> {
  const res = await fetch(`${API_BASE}/benchmark/comparison`);
  return res.json();
}

export async function fetchConstraintAudit(): Promise<ConstraintAudit> {
  const res = await fetch(`${API_BASE}/optimization/audit`);
  return res.json();
}

export async function fetchTrajectory(destinationId: string, sku: string): Promise<ForwardForecastResponse> {
  const res = await fetch(`${API_BASE}/demand/trajectory/${destinationId}/${sku}`);
  return res.json();
}

export async function runSimulation(payload: any) {
  const res = await fetch(`${API_BASE}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function resetSimulation() {
  const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
  return res.json();
}

export async function approveRecommendation(id: string) {
  const res = await fetch(`${API_BASE}/recommendations/${id}/approve`, { method: 'POST' });
  return res.json();
}

export async function batchApproveRecommendations() {
  const res = await fetch(`${API_BASE}/recommendations/batch-approve`, { method: 'POST' });
  return res.json();
}

export async function sendCopilotQuery(query: string) {
  const res = await fetch(`${API_BASE}/copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return res.json();
}

export async function fetchCopilotBriefing() {
  const res = await fetch(`${API_BASE}/copilot/briefing`);
  return res.json();
}
