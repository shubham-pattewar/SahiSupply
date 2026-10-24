import {
  NetworkNode, ProductSKU, InventoryBatch, DemandForecast,
  AllocationRecommendation, NetworkSummaryMetrics, ConstraintAudit,
  BenchmarkComparison, ForwardForecastResponse, SectionMetadata
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

export async function fetchSections(): Promise<SectionMetadata[]> {
  const res = await fetch(`${API_BASE}/sections`);
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

export async function fetchProducts(category?: string): Promise<ProductSKU[]> {
  const url = category && category !== 'All' 
    ? `${API_BASE}/products?category=${encodeURIComponent(category)}`
    : `${API_BASE}/products`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchInventoryBatches(warehouseId?: string, sku?: string, category?: string): Promise<InventoryBatch[]> {
  const params = new URLSearchParams();
  if (warehouseId) params.append('warehouse_id', warehouseId);
  if (sku) params.append('sku', sku);
  if (category && category !== 'All') params.append('category', category);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/inventory/batches${queryStr}`);
  return res.json();
}

export async function fetchRecommendations(category?: string): Promise<AllocationRecommendation[]> {
  const url = category && category !== 'All'
    ? `${API_BASE}/distribution/recommendations?category=${encodeURIComponent(category)}`
    : `${API_BASE}/distribution/recommendations`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchMetrics(category?: string): Promise<NetworkSummaryMetrics> {
  const url = category && category !== 'All'
    ? `${API_BASE}/distribution/metrics?category=${encodeURIComponent(category)}`
    : `${API_BASE}/distribution/metrics`;
  const res = await fetch(url);
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
