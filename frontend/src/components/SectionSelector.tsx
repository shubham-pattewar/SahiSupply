import React from 'react';
import { SectionType, SectionMetadata } from '../types';
import { Sparkles, ShoppingCart, Pill, Layers, ShieldCheck, ThermometerSnowflake, TrendingUp } from 'lucide-react';

interface SectionSelectorProps {
  activeSection: SectionType;
  onSelectSection: (section: SectionType) => void;
  sections: SectionMetadata[];
  orderCounts: {
    all: number;
    cosmetics: number;
    groceries: number;
    pharmaceuticals: number;
  };
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
  activeSection,
  onSelectSection,
  sections,
  orderCounts
}) => {
  const currentMeta = sections.find(s => s.id === activeSection);

  return (
    <div className="space-y-3">
      {/* Segmented Control Bar */}
      <div className="glass-panel p-1.5 rounded-2xl border border-white/10 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* All Sections Button */}
          <button
            onClick={() => onSelectSection('All')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'All'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Sectors</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSection === 'All' ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'
            }`}>
              {orderCounts.all} Orders
            </span>
          </button>

          {/* Cosmetics Button */}
          <button
            onClick={() => onSelectSection('Cosmetics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'Cosmetics'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 ring-1 ring-pink-400/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>Cosmetics</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSection === 'Cosmetics' ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'
            }`}>
              {orderCounts.cosmetics} Orders
            </span>
          </button>

          {/* Groceries Button */}
          <button
            onClick={() => onSelectSection('Groceries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'Groceries'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <span>Groceries</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSection === 'Groceries' ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'
            }`}>
              {orderCounts.groceries} Orders
            </span>
          </button>

          {/* Pharmaceuticals Button */}
          <button
            onClick={() => onSelectSection('Pharmaceuticals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'Pharmaceuticals'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 ring-1 ring-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Pill className="w-4 h-4 text-sky-400" />
            <span>Pharmaceuticals</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSection === 'Pharmaceuticals' ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'
            }`}>
              {orderCounts.pharmaceuticals} Orders
            </span>
          </button>
        </div>

        {/* Section Operational Badge */}
        <div className="hidden xl:flex items-center gap-3 pr-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>3 Industry Sections Active</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5">
            <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-300" />
            <span>Cold-Chain Reefer & Dry Freight</span>
          </span>
        </div>
      </div>

      {/* Dynamic Sector Intelligence Banner */}
      {currentMeta ? (
        <div className={`p-3.5 rounded-xl border text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all ${
          activeSection === 'Cosmetics'
            ? 'bg-pink-500/10 border-pink-500/25 text-pink-200'
            : activeSection === 'Groceries'
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
            : 'bg-sky-500/10 border-sky-500/25 text-sky-200'
        }`}>
          <div className="flex items-start md:items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeSection === 'Cosmetics'
                ? 'bg-pink-500/20 text-pink-400'
                : activeSection === 'Groceries'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-sky-500/20 text-sky-400'
            }`}>
              {activeSection === 'Cosmetics' && <Sparkles className="w-4 h-4" />}
              {activeSection === 'Groceries' && <ShoppingCart className="w-4 h-4" />}
              {activeSection === 'Pharmaceuticals' && <Pill className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>{currentMeta.name}</span>
                <span className="text-[11px] font-normal opacity-75">— {currentMeta.tagline}</span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">{currentMeta.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {currentMeta.characteristics.map((char, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-black/25 border border-white/10 font-mono">
                {char}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs flex justify-between items-center text-slate-300">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>
              <strong className="text-white">Unified Multi-Sector FMCG Allocation:</strong> Google OR-Tools simultaneously optimizing inventory across <strong>Cosmetics (5 SKUs)</strong>, <strong>Groceries (5 SKUs)</strong>, and <strong>Pharmaceuticals (5 SKUs)</strong>.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[11px]">
            15 Products • 28 Hubs
          </span>
        </div>
      )}
    </div>
  );
};
