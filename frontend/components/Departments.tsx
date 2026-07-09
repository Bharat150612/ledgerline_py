import React from 'react';
import { AnalyticsSummary } from '../core/types.js';

interface DepartmentsProps {
  analytics: AnalyticsSummary;
  onFilterDepartment?: (dept: string) => void;
}

function getRiskBadgeStyle(avgProb: number) {
  if (avgProb >= 50) {
    return {
      bg: 'bg-[var(--color-risk-critical-bg)]',
      fg: 'text-[var(--color-risk-critical-fg)]',
      border: 'border-[var(--color-risk-critical-ring)]',
    };
  }
  if (avgProb >= 30) {
    return {
      bg: 'bg-[var(--color-risk-high-bg)]',
      fg: 'text-[var(--color-risk-high-fg)]',
      border: 'border-[var(--color-risk-high-ring)]',
    };
  }
  if (avgProb >= 15) {
    return {
      bg: 'bg-[var(--color-risk-medium-bg)]',
      fg: 'text-[var(--color-risk-medium-fg)]',
      border: 'border-[var(--color-risk-medium-ring)]',
    };
  }
  return {
    bg: 'bg-[var(--color-risk-low-bg)]',
    fg: 'text-[var(--color-risk-low-fg)]',
    border: 'border-[var(--color-risk-low-ring)]',
  };
}

function getDeptIconInfo(deptName: string) {
  const name = deptName.toLowerCase();
  
  // Icon styling is identical to mockup with red/pinkish circle backgrounds and red icons
  const iconBase = {
    bg: 'bg-[var(--color-risk-critical-bg)]',
    fg: 'text-[var(--color-rust)] border border-[var(--color-risk-critical-ring)]/35',
  };

  if (name.includes('finance')) {
    return {
      ...iconBase,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
  }
  if (name.includes('operation')) {
    return {
      ...iconBase,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    };
  }
  if (name.includes('engineering') || name.includes('tech') || name.includes('dev') || name.includes('software')) {
    return {
      ...iconBase,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    };
  }
  if (name.includes('marketing')) {
    return {
      ...iconBase,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    };
  }
  if (name.includes('sale')) {
    return {
      ...iconBase,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    };
  }
  if (name.includes('hr') || name.includes('human') || name.includes('people')) {
    return {
      ...iconBase,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    };
  }

  // Fallback
  return {
    bg: 'bg-[var(--color-ink-sunken)]',
    fg: 'text-[var(--color-bone-dim)] border border-[var(--color-hairline)]',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  };
}

export function Departments({ analytics, onFilterDepartment }: DepartmentsProps) {
  const sorted = [...analytics.departmentRisk].sort((a, b) => b.avgProbability - a.avgProbability);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title section with trend-down icon */}
      <div className="flex items-start gap-4">
        <div className="mt-1 flex items-center justify-center shrink-0">
          <svg className="w-8 h-8 text-[var(--color-rust)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l6 6 4-4 8 8m0 0h-5.25M21 17v-5.25" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--color-bone)] tracking-tight">Sector Attrition Ledger</h1>
          <p className="text-sm text-[var(--color-bone-dim)] mt-1.5 max-w-3xl">
            Consolidated statistical overview mapping risk signals across core company segments
          </p>
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((dept) => {
          const iconInfo = getDeptIconInfo(dept.department);
          const badgeStyle = getRiskBadgeStyle(dept.avgProbability);
          const healthIndex = 100 - dept.avgProbability;

          return (
            <div
              key={dept.department}
              className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--color-kraft-dim)]/50 transition-all duration-300 shadow-sm"
            >
              <div>
                {/* Header row: Icon, Dept Name, Risk Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconInfo.bg} ${iconInfo.fg}`}>
                      {iconInfo.icon}
                    </div>
                    <span className="font-display text-lg font-semibold text-[var(--color-bone)]">{dept.department}</span>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border shrink-0 ${badgeStyle.bg} ${badgeStyle.fg} ${badgeStyle.border}`}>
                    {dept.avgProbability}% Avg Risk
                  </span>
                </div>

                <hr className="border-[var(--color-hairline)] my-4 opacity-50" />

                {/* Headcount Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-bone-dim)]">Total Headcount</span>
                    <span className="font-bold text-[var(--color-bone)] text-sm">{dept.headcount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-bone-dim)]">Critical Alert Headcount</span>
                    <span className={`font-bold text-sm ${dept.criticalCount > 0 ? 'text-[var(--color-rust)]' : 'text-[var(--color-bone-dim)]'}`}>
                      {dept.criticalCount}
                    </span>
                  </div>
                </div>

                {/* Health Index Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-[var(--color-bone-dim)] mb-2">
                    <span>Segment Health Index</span>
                    <span className="font-semibold text-xs text-[var(--color-bone)]">{healthIndex}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-hairline)]/50 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-rust)]" style={{ width: `${healthIndex}%` }} />
                  </div>
                </div>
              </div>

              {/* Card Footer: Action Button */}
              <div>
                <hr className="border-[var(--color-hairline)] mt-6 mb-4 opacity-50" />
                <button
                  onClick={() => onFilterDepartment && onFilterDepartment(dept.department)}
                  className="w-full text-center text-[11px] font-bold text-[var(--color-rust)] hover:text-[var(--color-rust)]/80 transition-colors uppercase tracking-wider cursor-pointer py-1.5 flex items-center justify-center gap-1 hover:underline"
                >
                  Filter Division Directory &gt;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

