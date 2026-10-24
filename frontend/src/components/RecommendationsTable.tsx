import React, { useState } from 'react';
import { Search, Filter, CheckCircle2, Clock, Truck, ShieldAlert } from 'lucide-react';
import { AllocationRecommendation } from '../types';

interface RecommendationsTableProps {
  recommendations: AllocationRecommendation[];
  onApprove: (id: string) => void;
}

export const RecommendationsTable: React.FC<RecommendationsTableProps> = ({
  recommendations,
  onApprove
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filtered = recommendations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      r.product_name.toLowerCase().includes(term) ||
      r.origin_name.toLowerCase().includes(term) ||
      r.destination_name.toLowerCase().includes(term) ||
      r.batch_id.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term);

    const matchPrio = !selectedPriority || r.priority.includes(selectedPriority);
    const matchCat = !selectedCategory || r.category === selectedCategory;

    return matchSearch && matchPrio && matchCat;
  });

  return (
    <div className="glass-panel p-5 rounded-xl border border-white/10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Actionable Distribution Recommendations</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {filtered.length} Orders
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Google OR-Tools MIP optimized product shipments balancing stockouts, FEFO shelf life, and transportation costs.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product, hub, batch..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical (Stockout)</option>
            <option value="URGENT">Urgent (FEFO Salvage)</option>
            <option value="OPTIMAL">Optimal (FTL)</option>
            <option value="BUFFER">Buffer (Safety Stock)</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">All Categories</option>
            <option value="Dairy & Ultra-Fresh">Dairy & Ultra-Fresh</option>
            <option value="Cold-Pressed Beverages">Cold-Pressed Beverages</option>
            <option value="Packaged Foods & Snacks">Packaged Foods & Snacks</option>
            <option value="Personal & Home Care">Personal & Home Care</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5">Order ID</th>
              <th className="py-3 px-3.5">Product SKU</th>
              <th className="py-3 px-3.5">Supply Route</th>
              <th className="py-3 px-3.5">Batch & FEFO Status</th>
              <th className="py-3 px-3.5">Quantity</th>
              <th className="py-3 px-3.5">Freight Spend</th>
              <th className="py-3 px-3.5">Strategic Rationale</th>
              <th className="py-3 px-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.slice(0, 100).map((r) => {
              const isApproved = r.status.includes('Approved');
              const isCritical = r.priority.includes('CRITICAL');
              const isUrgent = r.priority.includes('URGENT');
              const isDangerShelf = r.remaining_shelf_life_pct <= 28;

              return (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3.5 font-mono">
                    <span className="text-cyan-400 font-bold block">{r.id}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-1 ${
                      isCritical ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      isUrgent ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {r.priority.split(' ')[0]}
                    </span>
                  </td>

                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-white">{r.product_name}</div>
                    <div className="text-[11px] text-slate-400">{r.category} | {r.sku}</div>
                  </td>

                  <td className="py-3 px-3.5">
                    <div className="font-medium text-slate-200">{r.origin_name.split('(')[0]}</div>
                    <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                      <span>➔</span> {r.destination_name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {r.lead_time_hours}h transit ({r.transport_mode.split(' ')[0]})
                    </div>
                  </td>

                  <td className="py-3 px-3.5 min-w-[130px]">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-300">{r.batch_id}</span>
                      <span className={isDangerShelf ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                        {r.days_to_expiry}d ({r.remaining_shelf_life_pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full rounded-full ${
                          isDangerShelf ? 'bg-rose-500' : (r.remaining_shelf_life_pct <= 55 ? 'bg-amber-500' : 'bg-emerald-500')
                        }`}
                        style={{ width: `${r.remaining_shelf_life_pct}%` }}
                      ></div>
                    </div>
                  </td>

                  <td className="py-3 px-3.5 font-mono">
                    <span className="font-bold text-white text-sm">{r.quantity_units.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 block font-sans">{r.quantity_cases} cases</span>
                  </td>

                  <td className="py-3 px-3.5 font-mono font-semibold text-slate-200">
                    ₹{r.freight_cost.toLocaleString()}
                  </td>

                  <td className="py-3 px-3.5 text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    {r.urgency_reason}
                  </td>

                  <td className="py-3 px-3.5 text-center">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dispatched</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onApprove(r.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-cyan-500 text-white hover:bg-cyan-400 transition-all cursor-pointer shadow-sm shadow-cyan-500/30"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
