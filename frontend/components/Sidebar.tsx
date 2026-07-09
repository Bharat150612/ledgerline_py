import React from 'react';
import { DbStatus } from '../services/api.js';

export type Tab = 'home' | 'upload' | 'overview' | 'departments' | 'directory' | 'reason_predictor';

const SECTIONS: { heading: string; items: { id: Tab; label: string; mark: string }[] }[] = [
  {
    heading: 'Console',
    items: [
      { id: 'home', label: 'Cover Page', mark: '00' },
      { id: 'upload', label: 'Intake', mark: '01' },
    ],
  },
  {
    heading: 'Analysis',
    items: [
      { id: 'overview', label: 'Global Ledger', mark: '02' },
      { id: 'departments', label: 'By Department', mark: '03' },
    ],
  },
  {
    heading: 'Casework',
    items: [
      { id: 'directory', label: 'Personnel Files', mark: '04' },
      { id: 'reason_predictor', label: 'Leave Predictor', mark: '05' },
    ],
  },
];

export function Sidebar({
  activeTab,
  onSelect,
  dbStatus,
  onReset,
  onExport,
  hasData,
}: {
  activeTab: Tab;
  onSelect: (t: Tab) => void;
  dbStatus: DbStatus | null;
  onReset: () => void;
  onExport: () => void;
  hasData: boolean;
}) {
  return (
    <aside className="no-print lg:w-72 lg:h-screen lg:fixed lg:top-0 lg:left-0 lg:z-40 bg-[var(--color-ink-sunken)] border-r border-[var(--color-hairline)] flex flex-col w-full">
      <div className="p-6 border-b border-[var(--color-hairline)]">
        <button onClick={() => onSelect('home')} className="flex items-center gap-3 cursor-pointer text-left">
          <span className="w-9 h-9 border border-[var(--color-kraft)] text-[var(--color-kraft)] font-display font-semibold flex items-center justify-center text-sm">L</span>
          <div>
            <div className="font-display font-semibold text-[var(--color-bone)] tracking-tight leading-none">Ledgerline</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--color-bone-dim)] mt-1">Attrition Risk Console</div>
          </div>
        </button>

        {dbStatus && (
          <div className="hidden lg:flex items-center gap-2 mt-4 text-[10px] font-mono text-[var(--color-bone-dim)]">
            <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-[var(--color-teal)]' : 'bg-[var(--color-amber)]'}`} />
            <span className="truncate">{dbStatus.connected ? 'Cloud ledger synced' : 'Local ledger (session only)'}</span>
          </div>
        )}
      </div>

      {/* Mobile tab strip */}
      <div className="lg:hidden no-scrollbar overflow-x-auto flex gap-1 px-4 py-3 border-b border-[var(--color-hairline)] whitespace-nowrap">
        {SECTIONS.flatMap((s) => s.items).map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wide cursor-pointer border ${
              activeTab === item.id
                ? 'border-[var(--color-kraft)] text-[var(--color-bone)] bg-[var(--color-ink-raised)]'
                : 'border-transparent text-[var(--color-bone-dim)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Spacer to push buttons to the bottom */}
      <div className="hidden lg:block flex-1" />

      <div className="p-5 border-t border-[var(--color-hairline)] flex flex-col gap-2">
        <button
          onClick={onReset}
          className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[var(--color-bone-dim)] hover:text-[var(--color-amber)] border border-[var(--color-hairline)] hover:border-[var(--color-amber)]/40 px-3 py-2.5 transition-colors cursor-pointer"
        >
          Clear the ledger
        </button>
        <button
          onClick={onExport}
          className="text-[10px] uppercase tracking-wider font-mono font-semibold text-[var(--color-bone)] bg-[var(--color-ink-raised)] hover:bg-[var(--color-hairline)]/60 border border-[var(--color-hairline)] px-3 py-2.5 transition-colors cursor-pointer"
        >
          Export records
        </button>
      </div>
    </aside>
  );
}
