import React, { useEffect, useState } from 'react';
import { Tab } from './Sidebar.js';
import { DbStatus } from '../services/api.js';

const TITLES: Record<Tab, string> = {
  home: 'Cover Page',
  upload: 'Dataset Intake',
  overview: 'Global Ledger',
  departments: 'Department Ledger',
  directory: 'Personnel Files',
  reason_predictor: 'Leave Reason Predictor',
};

const NAV_ITEMS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'upload', label: 'Intake' },
  { id: 'overview', label: 'Global Ledger' },
  { id: 'departments', label: 'By Department' },
  { id: 'directory', label: 'Personnel Files' },
  { id: 'reason_predictor', label: 'Leave Predictor' },
];

export function TopBar({
  activeTab,
  successMsg,
  onSelect,
  hasData,
  dbStatus,
  onReset,
  onExport,
  theme,
  onToggleTheme,
}: {
  activeTab: Tab;
  successMsg: string;
  onSelect: (t: Tab) => void;
  hasData: boolean;
  dbStatus: DbStatus | null;
  onReset: () => void;
  onExport: (format: 'excel' | 'pdf' | 'json') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  const [now, setNow] = useState(new Date());
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 lg:px-8 py-4 border-b border-[var(--color-hairline)] bg-[var(--color-ink)]/95 backdrop-blur sticky top-0 z-30 w-full">
      {/* Brand & Connection Status */}
      <div className="flex items-center gap-4">
        {/* Logo wordmark */}
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 bg-[var(--color-kraft)] text-[var(--color-kraft-fg)] rounded-md font-sans font-black flex items-center justify-center text-sm shadow-sm">L</span>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-[var(--color-bone)] tracking-tight leading-tight text-[13px]">Ledgerline</span>
            <span className="text-[7.5px] font-sans font-black uppercase tracking-widest text-[var(--color-kraft)] leading-none mt-0.5">Attrition Risk</span>
          </div>
        </div>

        {dbStatus && (
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--color-bone-dim)]">
            <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-[var(--color-teal)]' : 'bg-[var(--color-amber)]'}`} />
            <span className="truncate max-w-[120px] lg:max-w-none">{dbStatus.connected ? 'Cloud Synced' : 'Local Ledger'}</span>
          </div>
        )}
      </div>

      {/* Top Navigation Strip */}
      <nav className="flex items-center gap-1 bg-[var(--color-ink-sunken)]/60 border border-[var(--color-hairline)] p-1 rounded-full backdrop-blur-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const disabled = !hasData && item.id !== 'upload' && item.id !== 'home';
          return (
            <button
              key={item.id}
              onClick={() => !disabled && onSelect(item.id)}
              disabled={disabled}
              className={`px-4 py-1.5 rounded-full text-[11px] font-sans font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--color-bone)] text-[var(--color-ink)] font-extrabold shadow-sm'
                  : disabled
                  ? 'text-[var(--color-bone-faint)] opacity-40 cursor-not-allowed'
                  : 'text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Actions (Clear & Export) + Time/Message */}
      <div className="flex items-center justify-between lg:justify-end gap-5 text-[10px] font-mono text-[var(--color-bone-dim)] w-full lg:w-auto border-t lg:border-t-0 border-[var(--color-hairline)] pt-3 lg:pt-0">
        {successMsg && (
          <span className="text-[var(--color-teal)] normal-case truncate max-w-[150px] lg:max-w-none">{successMsg}</span>
        )}
        
        <div className="flex items-center gap-3 relative">
          <button
            onClick={onReset}
            className="text-[9.5px] uppercase tracking-wider font-mono font-bold text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition-colors cursor-pointer bg-transparent"
          >
            Clear
          </button>
          
          <div className="relative">
            <button
              onClick={() => setExportOpen((prev) => !prev)}
              className="text-[9.5px] uppercase tracking-wider font-mono font-bold text-[var(--color-kraft-fg)] bg-[var(--color-kraft)] hover:bg-[var(--color-kraft-dim)] px-4 py-1.5 rounded transition-all cursor-pointer shadow-md flex items-center gap-1"
            >
              Export
              <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className={`transform transition-transform ${exportOpen ? 'rotate-180' : ''}`}>
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {exportOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-44 bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] shadow-xl z-50 py-1.5 rounded text-left animate-fade-in">
                  <button
                    onClick={() => {
                      onExport('excel');
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-[var(--color-kraft)]/10 text-[var(--color-bone)] hover:text-[var(--color-kraft)] transition-colors flex items-center gap-2 cursor-pointer border-none"
                  >
                    <span>📊</span> Excel Spreadsheet (.xlsx)
                  </button>
                  <button
                    onClick={() => {
                      onExport('pdf');
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-[var(--color-kraft)]/10 text-[var(--color-bone)] hover:text-[var(--color-kraft)] transition-colors flex items-center gap-2 cursor-pointer border-none"
                  >
                    <span>📄</span> PDF Report (.pdf)
                  </button>
                  <button
                    onClick={() => {
                      onExport('json');
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-[var(--color-kraft)]/10 text-[var(--color-bone)] hover:text-[var(--color-kraft)] transition-colors flex items-center gap-2 cursor-pointer border-none"
                  >
                    <span>📦</span> Raw JSON (.json)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded border border-[var(--color-hairline)] hover:border-[var(--color-kraft)] text-[var(--color-bone)] hover:text-[var(--color-kraft)] transition-all cursor-pointer bg-[var(--color-ink-raised)] flex items-center justify-center shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {/* Sun icon (switches to light) */}
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {/* Moon icon (switches to dark) */}
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          <span className="hidden lg:inline">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </header>
  );
}
