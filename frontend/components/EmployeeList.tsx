import React from 'react';
import { Employee } from '../core/types.js';
import { RiskPill } from './ui.js';

export function EmployeeList({
  employees,
  departments,
  searchQuery,
  onSearch,
  deptFilter,
  onDeptFilter,
  riskFilter,
  onRiskFilter,
  selectedEmpId,
  onSelect,
}: {
  employees: Employee[];
  departments: string[];
  searchQuery: string;
  onSearch: (v: string) => void;
  deptFilter: string;
  onDeptFilter: (v: string) => void;
  riskFilter: string;
  onRiskFilter: (v: string) => void;
  selectedEmpId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] flex flex-col h-full">
      <div className="p-4 border-b border-[var(--color-hairline)] space-y-2.5">
        <input
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search name, ID, or role…"
          className="w-full bg-[var(--color-ink)] border border-[var(--color-hairline)] px-3 py-2 text-xs text-[var(--color-bone)] placeholder-[var(--color-bone-faint)] focus:outline-none focus:border-[var(--color-kraft)]"
        />
        <div className="flex gap-2">
          <select
            value={deptFilter}
            onChange={(e) => onDeptFilter(e.target.value)}
            className="flex-1 bg-[var(--color-ink)] border border-[var(--color-hairline)] px-2 py-1.5 text-[10px] font-mono text-[var(--color-bone)] cursor-pointer"
          >
            <option value="All">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => onRiskFilter(e.target.value)}
            className="flex-1 bg-[var(--color-ink)] border border-[var(--color-hairline)] px-2 py-1.5 text-[10px] font-mono text-[var(--color-bone)] cursor-pointer"
          >
            <option value="All">All risk levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        {employees.length > 0 && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-kraft)] flex items-center justify-between pt-1">
            <span>Showing {employees.length} risk profiles</span>
            <span className="text-[var(--color-bone-dim)]">Sorted by risk</span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-[var(--color-hairline)] max-h-[1098px]">
        {employees.length === 0 && (
          <div className="p-6 text-center text-[11px] text-[var(--color-bone-dim)]">No records match this filter.</div>
        )}
        {employees.map((emp) => {
          const isActive = emp.id === selectedEmpId;
          return (
            <button
              key={emp.id}
              onClick={() => onSelect(emp.id)}
              className={`w-full text-left px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                isActive ? 'bg-[var(--color-kraft)]/10' : 'hover:bg-[var(--color-ink)]/60'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--color-bone)] truncate">{emp.name}</div>
                <div className="text-[10px] font-mono text-[var(--color-bone-dim)] mt-0.5 truncate">
                  {emp.id} · {emp.employment.jobRole}
                </div>
              </div>
              <RiskPill level={emp.analysis?.riskLevel} size="sm" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
