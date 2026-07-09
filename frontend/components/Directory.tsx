import React from 'react';
import { Employee } from '../core/types.js';
import { Eyebrow } from './ui.js';
import { EmployeeList } from './EmployeeList.js';
import { EmployeeDetail, SimState } from './EmployeeDetail.js';

export function Directory(props: {
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
  sim: SimState;
  setSim: (updater: (s: SimState) => SimState) => void;
  isSimulating: boolean;
  onApplySimulation: () => void;
  onResetSingle: () => void;
  aiSummary: string;
  isLoadingSummary: boolean;
  summaryError: string;
  onFetchSummary: () => void;
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Eyebrow>Casework</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-bone)] mt-2">Personnel files</h1>
        <p className="text-sm text-[var(--color-bone-dim)] mt-2 max-w-2xl">
          Open a file to review its risk breakdown, run a what-if simulation, or draft a narrative summary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4">
          <EmployeeList
            employees={props.filteredEmployees}
            departments={props.departments}
            searchQuery={props.searchQuery}
            onSearch={props.onSearch}
            deptFilter={props.deptFilter}
            onDeptFilter={props.onDeptFilter}
            riskFilter={props.riskFilter}
            onRiskFilter={props.onRiskFilter}
            selectedEmpId={props.selectedEmpId}
            onSelect={props.onSelect}
          />
        </div>
        <div className="lg:col-span-8">
          {props.selectedEmployee ? (
            <EmployeeDetail
              employee={props.selectedEmployee}
              sim={props.sim}
              setSim={props.setSim}
              isSimulating={props.isSimulating}
              onApplySimulation={props.onApplySimulation}
              onResetSingle={props.onResetSingle}
              aiSummary={props.aiSummary}
              isLoadingSummary={props.isLoadingSummary}
              summaryError={props.summaryError}
              onFetchSummary={props.onFetchSummary}
            />
          ) : (
            <div className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] p-10 text-center text-sm text-[var(--color-bone-dim)]">
              Select a file from the list to open it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
