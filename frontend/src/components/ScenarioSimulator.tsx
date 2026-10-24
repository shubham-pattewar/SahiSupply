import React, { useState } from 'react';
import { Play, RotateCcw, Zap, AlertTriangle, Truck, Factory, ShieldAlert } from 'lucide-react';
import { NetworkNode } from '../types';

interface ScenarioSimulatorProps {
  warehouses: NetworkNode[];
  onRunSimulation: (payload: any) => Promise<void>;
  onResetSimulation: () => Promise<void>;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  warehouses,
  onRunSimulation,
  onResetSimulation
}) => {
  const [demandMult, setDemandMult] = useState<number>(1.0);
  const [freightMult, setFreightMult] = useState<number>(1.0);
  const [outageWh, setOutageWh] = useState<string>('');
  const [outagePct, setOutagePct] = useState<number>(0);
  const [shelfDegradation, setShelfDegradation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('');

  const handleApplyPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === 'diwali') {
      setDemandMult(1.45);
      setFreightMult(1.15);
      setOutageWh('');
      setOutagePct(0);
      setShelfDegradation(0);
    } else if (preset === 'outage') {
      setDemandMult(1.0);
      setFreightMult(1.2);
      setOutageWh('CWH-DEL');
      setOutagePct(60);
      setShelfDegradation(0);
    } else if (preset === 'fuel') {
      setDemandMult(1.0);
      setFreightMult(1.4);
      setOutageWh('');
      setOutagePct(0);
      setShelfDegradation(0);
    } else if (preset === 'monsoon') {
      setDemandMult(1.05);
      setFreightMult(1.1);
      setOutageWh('');
      setOutagePct(0);
      setShelfDegradation(5);
    }
  };

  const handleRun = async () => {
    try {
      setLoading(true);
      await onRunSimulation({
        scenario_id: `SIM-${Date.now()}`,
        name: 'Interactive Shock Simulation',
        description: 'Simulated parameters executed via Google OR-Tools',
        demand_multiplier: demandMult,
        outage_warehouse_id: outageWh || null,
        outage_capacity_reduction_pct: outagePct,
        freight_rate_multiplier: freightMult,
        cold_chain_cost_multiplier: 1.0,
        shelf_life_degradation_days: shelfDegradation
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setDemandMult(1.0);
    setFreightMult(1.0);
    setOutageWh('');
    setOutagePct(0);
    setShelfDegradation(0);
    setActivePreset('');
    await onResetSimulation();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Simulation Parameter Controls */}
      <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>"What-If" Supply Chain Shock Simulator</span>
          </h2>
          <p className="text-xs text-slate-400">
            Dynamically inject regional volatility, warehouse shutdowns, and transit delays to evaluate network resilience
          </p>
        </div>

        {/* Preset Shocks */}
        <div>
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            One-Click Preset Shock Scenarios:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyPreset('diwali')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                activePreset === 'diwali'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              🎉 Diwali Festive Surge (+45%)
            </button>
            <button
              onClick={() => handleApplyPreset('outage')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                activePreset === 'outage'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              🏭 Northern Mega Plant Outage (-60%)
            </button>
            <button
              onClick={() => handleApplyPreset('fuel')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                activePreset === 'fuel'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              ⛽ Fuel & Freight Surcharge (+40%)
            </button>
            <button
              onClick={() => handleApplyPreset('monsoon')}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                activePreset === 'monsoon'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              ⏳ Monsoon Transit Delays (-5d Shelf Life)
            </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4 pt-2">
          {/* Demand */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Network Demand Multiplier:</span>
              <span className="font-mono text-cyan-400">{demandMult.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.05"
              value={demandMult}
              onChange={(e) => setDemandMult(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Freight */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Freight Logistics Rate Multiplier:</span>
              <span className="font-mono text-cyan-400">{freightMult.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.8"
              step="0.05"
              value={freightMult}
              onChange={(e) => setFreightMult(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Outage Hub */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Simulate Outage at Specific Warehouse Hub:
            </label>
            <select
              value={outageWh}
              onChange={(e) => setOutageWh(e.target.value)}
              className="w-full text-xs p-2 rounded bg-slate-900 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">None (All Warehouses 100% Operational)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
              ))}
            </select>

            <div className="flex justify-between text-xs font-semibold pt-1">
              <span className="text-slate-400">Throughput Capacity Loss:</span>
              <span className="font-mono text-rose-400">-{outagePct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={outagePct}
              onChange={(e) => setOutagePct(parseInt(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* Shelf Life Delay */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Shelf-Life Transit Degradation:</span>
              <span className="font-mono text-amber-400">{shelfDegradation} days lost</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={shelfDegradation}
              onChange={(e) => setShelfDegradation(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/30 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{loading ? 'Running Google OR-Tools MIP...' : 'Run AI What-If Simulation'}</span>
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-semibold text-xs hover:bg-white/10 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Adaptation Intelligence Explanations */}
      <div className="glass-panel p-6 rounded-xl border border-white/10 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-white mb-2">
            Google OR-Tools Dynamic Re-Balancing Mechanics
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            How the Mixed-Integer Linear Programming solver defends margins and service levels under simulated volatility:
          </p>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                <Factory className="w-4 h-4" />
                <span>Automated Cross-Depot Load Shifting</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                When a major plant (e.g. Kundli/Delhi CWH) suffers a 60% capacity outage, the engine relaxes single-source boundaries and pools inventory from Western and Southern hubs to fulfill Northern consumer demand.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>FEFO Accelerated Salvage Routing</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                If monsoon highway delays degrade product shelf-life by 5 days, batches approaching retail rejection thresholds are dynamically diverted to nearby 10-minute Quick Commerce Dark Stores with 24h sell-through.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                <Truck className="w-4 h-4" />
                <span>Freight Surcharge Protection (FTL Packing)</span>
              </h4>
              <p className="text-slate-300 leading-relaxed">
                When fuel surcharges spike freight rates by 40%, the solver penalizes fragmented LTL runs and consolidates shipments into 16-ton Full Truckloads (FTL), preserving gross margin.
              </p>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-lg border border-white/10 mt-4">
          💡 The solver re-computes integer shipment decisions across all active constraints in ~0.2 seconds.
        </div>
      </div>
    </div>
  );
};
