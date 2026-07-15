import React from 'react';
import { Employee } from '../core/types.js';
import { Eyebrow } from './ui.js';
import { EmployeeList } from './EmployeeList.js';

function reasonColor(p: number) {
  if (p >= 75) return 'var(--color-rust)';
  if (p >= 50) return 'var(--color-amber)';
  if (p >= 25) return 'var(--color-fog)';
  return 'var(--color-teal)';
}

export function ReasonPredictor({
  filteredEmployees,
  departments,
  searchQuery,
  onSearch,
  deptFilter,
  onDeptFilter,
  riskFilter,
  onRiskFilter,
  selectedEmpId,
  onSelect,
  selectedEmployee,
  explanation,
  isLoadingExplanation,
  explanationError,
  onFetchExplanation,
}: {
  filteredEmployees: Employee[];
  departments: string[];
  searchQuery: string;
  onSearch: (v: string) => void;
  deptFilter: string;
  onDeptFilter: (v: string) => void;
  riskFilter: string;
  onRiskFilter: (v: string) => void;
  selectedEmpId: string | null;
  onSelect: (id: string) => void;
  selectedEmployee: Employee | null;
  explanation: string;
  isLoadingExplanation: boolean;
  explanationError: string;
  onFetchExplanation: () => void;
}) {
  const prediction = selectedEmployee?.analysis?.reasonPrediction;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Eyebrow>Predictor</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-bone)] mt-2">Leave-reason predictor</h1>
        <p className="text-sm text-[var(--color-bone-dim)] mt-2 max-w-2xl">
          Ranks the most probable reason a specific employee would resign, and can draft an expert interpretation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4">
          <EmployeeList
            employees={filteredEmployees}
            departments={departments}
            searchQuery={searchQuery}
            onSearch={onSearch}
            deptFilter={deptFilter}
            onDeptFilter={onDeptFilter}
            riskFilter={riskFilter}
            onRiskFilter={onRiskFilter}
            selectedEmpId={selectedEmpId}
            onSelect={onSelect}
          />
        </div>

        <div className="lg:col-span-8">
          {!selectedEmployee || !prediction ? (
            <div className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] p-10 text-center text-sm text-[var(--color-bone-dim)]">
              Select a file from the list to run the predictor.
            </div>
          ) : (
            <div className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)]">
              <div className="p-6 border-b border-[var(--color-hairline)]">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-1">{selectedEmployee.id}</div>
                <h2 className="font-display text-2xl font-semibold text-[var(--color-bone)]">{selectedEmployee.name}</h2>
                <div className="text-xs text-[var(--color-bone-dim)] mt-1">
                  {selectedEmployee.employment.jobRole} · {selectedEmployee.employment.department}
                </div>
                <div className="mt-4 inline-flex items-baseline gap-2 border border-[var(--color-kraft)]/40 bg-[var(--color-kraft)]/10 px-4 py-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)]">Primary predicted reason</span>
                  <span className="font-display font-semibold text-[var(--color-kraft)]">{prediction.primaryReason}</span>
                  <span className="font-mono text-[10px] text-[var(--color-bone-dim)]">{prediction.confidence}% confidence</span>
                </div>
              </div>

              <div className="p-6 border-b border-[var(--color-hairline)] space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-1">Reason probabilities</div>
                {prediction.reasonProbabilities.map((rp) => (
                  <div key={rp.reason}>
                    <div className="flex items-center justify-between text-[11.5px] mb-1">
                      <span className="text-[var(--color-bone)] font-semibold">{rp.reason}</span>
                      <span className="font-mono text-[var(--color-bone-dim)]">{rp.probability}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-hairline)] mb-1">
                      <div className="h-full" style={{ width: `${rp.probability}%`, backgroundColor: reasonColor(rp.probability) }} />
                    </div>
                    <p className="text-[10.5px] text-[var(--color-bone-dim)]">{rp.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)]">Expert interpretation</div>
                  <button
                    onClick={onFetchExplanation}
                    disabled={isLoadingExplanation}
                    className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-kraft)] hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingExplanation ? 'Interpreting…' : explanation ? 'Re-run' : 'Interpret this case'}
                  </button>
                </div>
                {explanationError && <div className="text-[11px] text-[var(--color-rust)] mb-2">{explanationError}</div>}
                {explanation ? (
                  <p className="text-[12.5px] leading-relaxed text-[var(--color-bone)] whitespace-pre-line">{explanation}</p>
                ) : (
                  <p className="text-[11.5px] text-[var(--color-bone-dim)] italic">No interpretation drafted yet for this file.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
