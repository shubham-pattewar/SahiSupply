import React from 'react';
import { Sparkles, ShieldCheck, Download, RefreshCw, Send, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onReoptimize: () => void;
  onBatchDispatch: () => void;
  onExportCsv: () => void;
  onOpenAudit: () => void;
  theme: string;
  onToggleTheme: () => void;
  isDbMock: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReoptimize,
  onBatchDispatch,
  onExportCsv,
  onOpenAudit,
  theme,
  onToggleTheme,
  isDbMock
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white font-extrabold text-xl font-mono">
          S²
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              SahiSupply™ AI
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              OR-Tools MIP & FEFO Active
            </span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span>Enterprise FMCG Distribution Intelligence</span>
            <span className="text-slate-600">•</span>
            <span className={isDbMock ? "text-amber-400" : "text-emerald-400"}>
              {isDbMock ? "MongoDB (In-Memory Mock)" : "MongoDB (Connected)"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={onOpenAudit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer"
          title="Open Independent Constraint Checker Audit"
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Audit Constraints</span>
        </button>

        <button
          onClick={onReoptimize}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          title="Re-run Google OR-Tools optimization"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Re-optimize</span>
        </button>

        <button
          onClick={onBatchDispatch}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 hover:brightness-110 transition-all cursor-pointer"
          title="Approve and release all pending shipments"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Batch Dispatch All</span>
        </button>

        <button
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          title="Export logistics manifest to CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-300" />
          <span>Export Manifest</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
          title="Toggle Dark/Light Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>
      </div>
    </header>
  );
};
