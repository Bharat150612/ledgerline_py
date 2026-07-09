import React from 'react';

export function riskTone(level?: string) {
  switch (level) {
    case 'Critical':
      return {
        fg: 'text-[var(--color-risk-critical-fg)]',
        bg: 'bg-[var(--color-risk-critical-bg)]',
        ring: 'ring-[var(--color-risk-critical-ring)]',
        dot: 'bg-[var(--color-risk-critical-fg)]'
      };
    case 'High':
      return {
        fg: 'text-[var(--color-risk-high-fg)]',
        bg: 'bg-[var(--color-risk-high-bg)]',
        ring: 'ring-[var(--color-risk-high-ring)]',
        dot: 'bg-[var(--color-risk-high-fg)]'
      };
    case 'Medium':
      return {
        fg: 'text-[var(--color-risk-medium-fg)]',
        bg: 'bg-[var(--color-risk-medium-bg)]',
        ring: 'ring-[var(--color-risk-medium-ring)]',
        dot: 'bg-[var(--color-risk-medium-fg)]'
      };
    default:
      return {
        fg: 'text-[var(--color-risk-low-fg)]',
        bg: 'bg-[var(--color-risk-low-bg)]',
        ring: 'ring-[var(--color-risk-low-ring)]',
        dot: 'bg-[var(--color-risk-low-fg)]'
      };
  }
}

export function RiskPill({ level, size = 'md' }: { level?: string; size?: 'sm' | 'md' }) {
  const tone = riskTone(level);
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm font-mono font-semibold uppercase tracking-wider ring-1 ${tone.bg} ${tone.fg} ${tone.ring} ${pad}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
      {level || 'Unrated'}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[var(--color-kraft)]">
      {children}
    </div>
  );
}

export function FolderCard({
  children,
  label,
  className = '',
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`relative bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] ${className}`}>
      {label && (
        <div className="tab-card absolute -top-[26px] left-0 bg-[var(--color-ink-raised)] border-t border-x border-[var(--color-hairline)] px-4 pt-1.5 pb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--color-bone-dim)]">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  purpose,
  onUpload,
  onTemplate,
}: {
  title: string;
  purpose: string;
  onUpload: () => void;
  onTemplate: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 animate-fade-in text-center">
      <div className="mx-auto w-14 h-14 border border-dashed border-[var(--color-hairline)] rounded-full flex items-center justify-center mb-6 text-[var(--color-kraft)]">
        <span className="font-display text-xl">§</span>
      </div>
      <Eyebrow>No case file loaded</Eyebrow>
      <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-bone)] mt-3 mb-3">
        {title} is waiting on a roster
      </h2>
      <p className="text-sm text-[var(--color-bone-dim)] leading-relaxed mb-8">
        {purpose} Import a personnel spreadsheet (.csv or .xlsx) to populate this workspace.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onUpload}
          className="px-5 py-3 bg-[var(--color-kraft)] hover:bg-[#b87b39] text-[#14171c] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Open intake
        </button>
        <button
          onClick={onTemplate}
          className="px-5 py-3 border border-[var(--color-hairline)] hover:border-[var(--color-kraft-dim)] text-[var(--color-bone)] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Download template
        </button>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = 'kraft',
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: 'kraft' | 'rust' | 'amber' | 'teal' | 'fog';
}) {
  const accentColor = {
    kraft: 'var(--color-kraft)',
    rust: 'var(--color-rust)',
    amber: 'var(--color-amber)',
    teal: 'var(--color-teal)',
    fog: 'var(--color-fog)',
  }[accent];
  return (
    <div className="bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] p-5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-2.5">{label}</div>
      <div className="font-display text-3xl font-semibold text-[var(--color-bone)]">{value}</div>
      <div className="w-9 h-[3px] mt-3" style={{ backgroundColor: accentColor }} />
      {sub && <div className="text-[11px] text-[var(--color-bone-dim)] mt-2.5">{sub}</div>}
    </div>
  );
}
