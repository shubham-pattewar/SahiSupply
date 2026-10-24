import React from 'react';
import { Target, TrendingDown, ShieldAlert, Truck, DollarSign } from 'lucide-react';
import { NetworkSummaryMetrics } from '../types';

interface TelemetryStripProps {
  metrics: NetworkSummaryMetrics | null;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 px-6 pt-6 pb-2">
      {/* 1. Fulfillment */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <span>Network Fulfillment</span>
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white mt-1">
          {metrics.fulfillment_rate_pct}%
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400">
            ↑ High OTIF
          </span>
          <span>vs 75.2% legacy baseline</span>
        </div>
      </div>

      {/* 2. Stockout Rate */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-rose-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <span>Stockout Rate</span>
          <TrendingDown className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white mt-1">
          {metrics.stockout_rate_pct}%
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400">
            -{metrics.stockout_reduction_pct}%
          </span>
          <span>Unmet retail demand</span>
        </div>
      </div>

      {/* 3. FEFO Expiry Salvage */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <span>FEFO Expiry Salvage</span>
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white mt-1">
          ₹{(metrics.wastage_loss_saved_value / 100000).toFixed(2)}L
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400">
            {metrics.wastage_prevented_units.toLocaleString()} units
          </span>
          <span>100% FEFO adherence</span>
        </div>
      </div>

      {/* 4. Freight Logistics Spend */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <span>Freight Logistics Spend</span>
          <Truck className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white mt-1">
          ₹{(metrics.total_freight_cost / 100000).toFixed(2)}L
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300">
            ₹{metrics.cost_per_unit_shipped.toFixed(2)}/unit
          </span>
          <span>Consolidated FTL routes</span>
        </div>
      </div>

      {/* 5. Net Financial ROI */}
      <div className="glass-panel p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500"></div>
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <span>Net Financial ROI</span>
          <DollarSign className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white mt-1">
          ₹{(metrics.cost_saved_vs_baseline / 100000).toFixed(2)}L
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-400">
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-300">
            +{metrics.savings_vs_baseline_pct}% ROI
          </span>
          <span>Savings vs baseline</span>
        </div>
      </div>
    </section>
  );
};
