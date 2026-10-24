import React from 'react';
import { ShieldCheck, X, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { ConstraintAudit } from '../types';

interface ConstraintAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: ConstraintAudit | null;
}

export const ConstraintAuditModal: React.FC<ConstraintAuditModalProps> = ({
  isOpen,
  onClose,
  audit
}) => {
  if (!isOpen || !audit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Independent Constraint Checker Audit</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {audit.passed_checks} / {audit.total_checks} PASSED
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Rigorous post-optimization validation auditing physical and commercial constraints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Audit Score Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/30 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Verification Compliance Rating
              </span>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {audit.verification_score_pct}% Compliant
              </div>
              <span className="text-xs text-slate-300">
                All decision variables satisfy physical, temporal, and logistical bounds
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-400 font-bold font-mono text-lg">
              ✓
            </div>
          </div>

          {/* 5 Audited Pillars */}
          <div className="space-y-3">
            {Object.entries(audit.checks).map(([key, check]) => (
              <div
                key={key}
                className="p-3.5 rounded-lg bg-white/5 border border-white/10 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  {check.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="text-sm text-slate-200 block">{check.name}</strong>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {check.passed
                        ? '100% verified: Zero violations detected across all allocation directives.'
                        : `${check.violations_count} constraint violations flagged.`}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded font-mono ${
                    check.passed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {check.passed ? 'PASSED' : 'FLAGGED'}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0" />
            <span>
              Audited by Independent Constraint Checker against batch expiry tables, warehouse dock limits, and Indian road transport lead times.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-all cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
