import React, { useState, useEffect } from 'react';
import {
  fetchNetworkNodes, fetchProducts, fetchInventoryBatches,
  fetchRecommendations, fetchMetrics, fetchBenchmark,
  fetchConstraintAudit, resetSimulation, runSimulation,
  approveRecommendation, batchApproveRecommendations, fetchDatabaseStatus,
  fetchSections
} from './api/client';
import {
  NetworkNode, ProductSKU, InventoryBatch, AllocationRecommendation,
  NetworkSummaryMetrics, BenchmarkComparison, ConstraintAudit,
  SectionType, SectionMetadata
} from './types';
import { Header } from './components/Header';
import { TelemetryStrip } from './components/TelemetryStrip';
import { SectionSelector } from './components/SectionSelector';
import { LeafletNetworkMap } from './components/LeafletNetworkMap';
import { RecommendationsTable } from './components/RecommendationsTable';
import { ImpactBenchmark } from './components/ImpactBenchmark';
import { ForecastRadar } from './components/ForecastRadar';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { ConstraintAuditModal } from './components/ConstraintAuditModal';
import { CopilotDrawer } from './components/CopilotDrawer';
import { MapPin, ListFilter, BarChart3, TrendingUp, Zap, BookOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [nodes, setNodes] = useState<{ cwhs: NetworkNode[]; rdcs: NetworkNode[]; destinations: NetworkNode[] }>({
    cwhs: [],
    rdcs: [],
    destinations: []
  });
  const [products, setProducts] = useState<ProductSKU[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [recommendations, setRecommendations] = useState<AllocationRecommendation[]>([]);
  const [sections, setSections] = useState<SectionMetadata[]>([]);
  const [activeSection, setActiveSection] = useState<SectionType>('All');
  const [metrics, setMetrics] = useState<NetworkSummaryMetrics | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkComparison | null>(null);
  const [audit, setAudit] = useState<ConstraintAudit | null>(null);
  const [isDbMock, setIsDbMock] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'recs' | 'benchmark' | 'forecast' | 'simulator' | 'methodology'>('map');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAllData = async (sectionOverride?: SectionType) => {
    try {
      const targetSec = sectionOverride || activeSection;
      const [nodesData, prodsData, batchesData, recsData, metricsData, benchData, auditData, dbStatus, sectionsData] = await Promise.all([
        fetchNetworkNodes(),
        fetchProducts(),
        fetchInventoryBatches(),
        fetchRecommendations(),
        fetchMetrics(targetSec),
        fetchBenchmark(),
        fetchConstraintAudit(),
        fetchDatabaseStatus(),
        fetchSections()
      ]);

      setNodes(nodesData);
      setProducts(prodsData);
      setBatches(batchesData);
      setRecommendations(recsData);
      setMetrics(metricsData);
      setBenchmark(benchData);
      setAudit(auditData);
      setIsDbMock(dbStatus.is_mock);
      setSections(sectionsData);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      showToast('Error connecting to SahiSupply backend.', 'error');
    }
  };

  const handleSelectSection = async (nextSection: SectionType) => {
    setActiveSection(nextSection);
    try {
      const secMetrics = await fetchMetrics(nextSection);
      setMetrics(secMetrics);
    } catch (err) {
      console.error('Error fetching section metrics:', err);
    }
  };

  const filteredRecommendations = activeSection === 'All'
    ? recommendations
    : recommendations.filter(r => r.category.toLowerCase() === activeSection.toLowerCase());

  const filteredBatches = activeSection === 'All'
    ? batches
    : batches.filter(b => b.category.toLowerCase() === activeSection.toLowerCase());

  const orderCounts = {
    all: recommendations.length,
    cosmetics: recommendations.filter(r => r.category === 'Cosmetics').length,
    groceries: recommendations.filter(r => r.category === 'Groceries').length,
    pharmaceuticals: recommendations.filter(r => r.category === 'Pharmaceuticals').length
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleReoptimize = async () => {
    try {
      showToast('Running Google OR-Tools MIP & FEFO solver...', 'info');
      await resetSimulation();
      await loadAllData();
      showToast('Network optimal plan regenerated via Google OR-Tools!', 'success');
    } catch (err) {
      showToast('Optimization failed.', 'error');
    }
  };

  const handleBatchDispatch = async () => {
    try {
      const res = await batchApproveRecommendations();
      await loadAllData();
      showToast(`Batch approved & dispatched ${res.approved_count} consignments!`, 'success');
    } catch (err) {
      showToast('Batch dispatch approval failed.', 'error');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveRecommendation(id);
      setRecommendations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'Approved & Dispatched' } : r)
      );
      showToast(`Order ${id} approved for dispatch!`, 'success');
    } catch (err) {
      showToast('Could not approve order.', 'error');
    }
  };

  const handleExportCsv = () => {
    if (!recommendations.length) {
      showToast('No recommendations available to export.', 'error');
      return;
    }

    const headers = [
      'Order ID', 'Product SKU', 'Product Name', 'Category',
      'Origin Hub', 'Destination Node', 'Batch ID', 'Days to Expiry',
      'Shelf Life Left %', 'Allocated Units', 'Cases', 'Priority',
      'Transit Mode', 'Lead Time (Hrs)', 'Freight Cost (INR)', 'Urgency Reason', 'Status'
    ];

    const rows = recommendations.map(r => [
      r.id, r.sku, `"${r.product_name}"`, `"${r.category}"`,
      `"${r.origin_name}"`, `"${r.destination_name}"`, r.batch_id, r.days_to_expiry,
      r.remaining_shelf_life_pct, r.quantity_units, r.quantity_cases, `"${r.priority}"`,
      `"${r.transport_mode}"`, r.lead_time_hours, r.freight_cost, `"${r.urgency_reason.replace(/"/g, '""')}"`, `"${r.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SahiSupply_Dispatch_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Logistics manifest exported successfully as CSV!', 'success');
  };

  const handleRunSimulation = async (payload: any) => {
    try {
      const res = await runSimulation(payload);
      await loadAllData();
      showToast('What-If simulation executed! Allocations re-balanced.', 'success');
    } catch (err) {
      showToast('Simulation execution failed.', 'error');
    }
  };

  const handleResetSimulation = async () => {
    try {
      await resetSimulation();
      await loadAllData();
      showToast('Optimal baseline plan restored.', 'success');
    } catch (err) {
      showToast('Failed to reset simulation.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl backdrop-blur-md border ${
          toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
          toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' :
          'bg-cyan-500/90 border-cyan-400 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header Command Bar */}
      <Header
        onReoptimize={handleReoptimize}
        onBatchDispatch={handleBatchDispatch}
        onExportCsv={handleExportCsv}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isDbMock={isDbMock}
      />

      {/* KPI Telemetry Strip */}
      <TelemetryStrip metrics={metrics} />

      {/* 3 Industry Sectors Switcher: Cosmetics | Groceries | Pharmaceuticals */}
      <div className="px-6 pt-3">
        <SectionSelector
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          sections={sections}
          orderCounts={orderCounts}
        />
      </div>

      {/* Navigation Tabs */}
      <nav className="px-6 pt-3 pb-1 border-b border-white/10 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('map')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Leaflet Geospatial Map</span>
          </button>

          <button
            onClick={() => setActiveTab('recs')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'recs'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Actionable Recommendations</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Impact Benchmark (AI vs Baseline)</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'forecast'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Demand Forecasting & Risk Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>"What-If" Scenario Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('methodology')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'methodology'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mathematical Formulation</span>
          </button>
        </div>
      </nav>

      {/* Main Tab Views */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'map' && (
          <LeafletNetworkMap
            nodes={nodes}
            recommendations={filteredRecommendations}
            batches={filteredBatches}
          />
        )}

        {activeTab === 'recs' && (
          <RecommendationsTable
            recommendations={filteredRecommendations}
            onApprove={handleApprove}
          />
        )}

        {activeTab === 'benchmark' && (
          <ImpactBenchmark benchmark={benchmark} />
        )}

        {activeTab === 'forecast' && (
          <ForecastRadar
            destinations={nodes.destinations}
            products={products}
          />
        )}

        {activeTab === 'simulator' && (
          <ScenarioSimulator
            warehouses={[...nodes.cwhs, ...nodes.rdcs]}
            onRunSimulation={handleRunSimulation}
            onResetSimulation={handleResetSimulation}
          />
        )}

        {activeTab === 'methodology' && (
          <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-6 max-w-4xl mx-auto text-xs leading-relaxed text-slate-300">
            <div>
              <h2 className="text-base font-bold text-white mb-2">
                1. Mathematical Formulation (Mixed-Integer Linear Programming)
              </h2>
              <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 font-mono text-cyan-300 mb-2">
                min ∑ (FreightCost * X) + ∑ (StockoutPenalty * U) + ∑ (SpoilagePenalty * W) - ∑ (FEFOSalvageReward * X)
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Stockout Penalty:</strong> 1.5x product gross margin ($1.5 \times (RetailPrice - UnitCost)$) accounting for lost sales and customer switching.</li>
                <li><strong>Spoilage Loss Penalty:</strong> 1.25x unit cost accounting for 100% write-off and disposal handling fees.</li>
                <li><strong>FEFO Salvage Incentive:</strong> Reward for routing aging batches ($RSL \le 28\%$) to high-velocity nodes before expiration.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-2">
                2. Hard Constraints Enforced by Google OR-Tools
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Retail Dock Acceptance Threshold:</strong> DaysToExpiry - TransitLeadTimeDays ≥ MinRetailShelfLifeDays. Shipments failing this condition are rejected at destination dock and forbidden.</li>
                <li><strong>Dynamic Safety Stock:</strong> Sized via formula SS = Z * sigma * sqrt(LeadTime) (Z=1.645 for modern supermarkets; Z=2.05 for quick-commerce dark stores).</li>
                <li><strong>Throughput Capacity:</strong> Dispatched volume respects warehouse outbound daily dock handling limits.</li>
                <li><strong>Case Pack Sizing:</strong> Shipments are strict integer multiples of carton case packs.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base font-bold text-white mb-2">
                3. Independent Constraint Checker Validation
              </h2>
              <p className="text-slate-400">
                An independent verification layer audits every generated shipment after optimization to ensure 100% compliance across inventory balances, non-negative demand, transit feasibility, and warehouse limits.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Copilot Drawer */}
      <CopilotDrawer />

      {/* Independent Constraint Checker Modal */}
      <ConstraintAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        audit={audit}
      />
    </div>
  );
};

export default App;
