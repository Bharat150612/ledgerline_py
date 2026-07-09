import React from 'react';
import { Employee } from '../core/types.js';
import { RiskDial } from './RiskDial.js';
import { RiskPill } from './ui.js';

export interface SimState {
  salary: number;
  overtime: number;
  wlb: number;
  mgrRel: number;
  jobSat: number;
  recognition: number;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = '',
  isCurrency = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
  isCurrency?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-[var(--color-bone)]">{label}</span>
        <span className="font-mono text-[11px] text-[var(--color-kraft)]">
          {isCurrency ? `₹${value.toLocaleString()}` : `${value.toLocaleString()}${suffix}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-kraft)] cursor-pointer"
      />
    </div>
  );
}

const getRiskColors = (level: 'Low' | 'Medium' | 'High' | 'Critical') => {
  switch (level) {
    case 'Critical':
      return {
        text: 'text-[var(--color-risk-critical-fg)]',
        bg: 'bg-[var(--color-risk-critical-bg)]',
        border: 'border-[var(--color-risk-critical-ring)]',
        label: 'text-[var(--color-risk-critical-fg)]',
        badgeBg: 'bg-[var(--color-risk-critical-fg)]',
        progress: 'bg-[var(--color-risk-critical-fg)]'
      };
    case 'High':
      return {
        text: 'text-[var(--color-risk-high-fg)]',
        bg: 'bg-[var(--color-risk-high-bg)]',
        border: 'border-[var(--color-risk-high-ring)]',
        label: 'text-[var(--color-risk-high-fg)]',
        badgeBg: 'bg-[var(--color-risk-high-fg)]',
        progress: 'bg-[var(--color-risk-high-fg)]'
      };
    case 'Medium':
      return {
        text: 'text-[var(--color-risk-medium-fg)]',
        bg: 'bg-[var(--color-risk-medium-bg)]',
        border: 'border-[var(--color-risk-medium-ring)]',
        label: 'text-[var(--color-risk-medium-fg)]',
        badgeBg: 'bg-[var(--color-risk-medium-fg)]',
        progress: 'bg-[var(--color-risk-medium-fg)]'
      };
    case 'Low':
    default:
      return {
        text: 'text-[var(--color-risk-low-fg)]',
        bg: 'bg-[var(--color-risk-low-bg)]',
        border: 'border-[var(--color-risk-low-ring)]',
        label: 'text-[var(--color-risk-low-fg)]',
        badgeBg: 'bg-[var(--color-risk-low-fg)]',
        progress: 'bg-[var(--color-risk-low-fg)]'
      };
  }
};

function MetricRow({ label, value, highlightRed }: { label: string; value: React.ReactNode; highlightRed?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[11px] border-b border-[var(--color-hairline)]/30 last:border-0">
      <span className="text-[var(--color-bone-dim)] font-sans">{label}</span>
      <span className={`font-semibold font-mono ${highlightRed ? 'text-[var(--color-rust)]' : 'text-[var(--color-bone)]'}`}>{value}</span>
    </div>
  );
}

function SentimentCard({ label, score }: { label: string; score: number }) {
  const percentage = (score / 5) * 100;
  
  // Custom theme-friendly color mapping for score rating
  const getScoreColor = (s: number) => {
    if (s <= 2) return 'var(--color-rust)';
    if (s === 3) return 'var(--color-amber)';
    return 'var(--color-teal)';
  };

  return (
    <div className="bg-[var(--color-ink)]/40 border border-[var(--color-hairline)] rounded p-3 flex flex-col justify-between">
      <div className="text-[10px] font-semibold text-[var(--color-bone-dim)] uppercase tracking-wider mb-1.5">{label}</div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold font-mono">{score} / 5</span>
      </div>
      <div className="w-full bg-[var(--color-hairline)] h-1 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: getScoreColor(score) }} />
      </div>
    </div>
  );
}

export function EmployeeDetail({
  employee,
  sim,
  setSim,
  isSimulating,
  onApplySimulation,
  onResetSingle,
  aiSummary,
  isLoadingSummary,
  summaryError,
  onFetchSummary,
}: {
  employee: Employee;
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
  const analysis = employee.analysis;
  
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const riskColors = getRiskColors(analysis?.riskLevel || 'Low');

  const baselineSalary = employee.baseline?.salary ?? employee.compensation.salary;
  const isLargeSalary = baselineSalary > 200000;
  const salaryMin = isLargeSalary ? Math.floor(baselineSalary * 0.2 / 10000) * 10000 : 10000;
  const salaryMax = isLargeSalary ? Math.ceil(baselineSalary * 3 / 10000) * 10000 : 300000;
  const salaryStep = isLargeSalary ? 10000 : 1000;

  return (
    <div className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)]">
      {/* 1. Header Banner Panel */}
      <div className="p-6 border-b border-[var(--color-hairline)] flex flex-col md:flex-row items-center md:items-start justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Initials Avatar */}
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold bg-[var(--color-kraft)] text-[var(--color-kraft-fg)] shrink-0 shadow-md">
            {initials}
          </div>
          {/* Metadata */}
          <div className="text-center sm:text-left">
            <h2 className="font-sans text-2xl font-bold text-[var(--color-bone)] tracking-tight">{employee.name}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1 text-[11px] font-semibold text-[var(--color-bone-dim)] uppercase tracking-wider">
              <span className="text-[var(--color-teal)]">●</span>
              <span>{employee.employment.jobRole}</span>
              <span className="text-[var(--color-bone-faint)]">•</span>
              <span>{employee.employment.department}</span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[var(--color-bone-dim)]">
              ID: {employee.id} &bull; {employee.email} &bull; {employee.personal.gender}, {employee.personal.age} yrs &bull; {employee.personal.maritalStatus}
            </div>
          </div>
        </div>

        {/* Flight Probability Index */}
        {analysis && (
          <div className={`p-4 border-2 ${riskColors.border} ${riskColors.bg} shadow-md rounded relative overflow-hidden flex flex-col items-start gap-1`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--color-kraft)]/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-[var(--color-bone-dim)] font-bold mb-1">
              [ Core Prediction Model ]
            </span>
            <div className="flex items-center gap-3.5">
              <div className={`px-4 py-2.5 rounded bg-[var(--color-ink)] border ${riskColors.border} flex items-center justify-center`}>
                <span className={`text-3xl font-bold font-mono ${riskColors.text}`}>{analysis.probability}%</span>
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--color-bone)] uppercase tracking-wider leading-tight">{analysis.riskLevel} THREAT LEVEL</div>
                <div className="text-[9px] font-mono text-[var(--color-bone-dim)] mt-0.5">Confidence: {analysis.confidence}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Three Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Column 1: Employment & Tenure */}
        <div className="bg-[var(--color-ink-sunken)]/20 border border-[var(--color-hairline)] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-hairline)]">
            <svg className="w-4 h-4 text-[var(--color-rust)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)]">Employment & Tenure</span>
          </div>
          <div className="flex flex-col gap-2">
            <MetricRow label="Job Level" value={`Level ${employee.employment.jobLevel} / 5`} />
            <MetricRow label="Years Active" value={`${employee.employment.yearsAtCompany} yrs`} />
            <MetricRow label="Years in Role" value={`${employee.employment.yearsInCurrentRole} yrs`} />
            <MetricRow label="Last Promotion" value={employee.employment.yearsSinceLastPromotion === 0 ? "This year" : `${employee.employment.yearsSinceLastPromotion} yrs ago`} highlightRed={employee.employment.yearsSinceLastPromotion >= 3} />
            <MetricRow label="With Manager" value={`${employee.employment.yearsWithCurrentManager} yrs`} />
          </div>
        </div>

        {/* Column 2: Compensation Metrics */}
        <div className="bg-[var(--color-ink-sunken)]/20 border border-[var(--color-hairline)] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-hairline)]">
            <svg className="w-4 h-4 text-[var(--color-rust)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)]">Compensation Metrics</span>
          </div>
          <div className="flex flex-col gap-2">
            <MetricRow label="Annual Salary" value={`₹${employee.compensation.salary.toLocaleString()}`} />
            <MetricRow label="Incentives & Bonus" value={`₹${(employee.compensation.bonus + employee.compensation.incentives).toLocaleString()}`} />
            <MetricRow label="Market Benchmark" value={`₹${employee.compensation.estimatedMarketSalary.toLocaleString()}`} />
            <MetricRow label="Compensation Deficit" value={employee.compensation.salaryGap > 0 ? `-₹${employee.compensation.salaryGap.toLocaleString()}` : `₹0`} highlightRed={employee.compensation.salaryGap > 0} />
            <MetricRow label="Benefits Sat." value={`${employee.compensation.benefitsSatisfaction} / 5`} />
          </div>
        </div>

        {/* Column 3: Workload & Stress */}
        <div className="bg-[var(--color-ink-sunken)]/20 border border-[var(--color-hairline)] rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-hairline)]">
            <svg className="w-4 h-4 text-[var(--color-rust)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)]">Workload & Stress</span>
          </div>
          <div className="flex flex-col gap-2">
            <MetricRow label="Weekly Hours" value={`${employee.workload.weeklyWorkingHours} hrs`} />
            <MetricRow label="Overtime Hours" value={`${employee.workload.overtimeHours} hrs / wk`} highlightRed={employee.workload.overtimeHours > 0} />
            <MetricRow label="Weekend Work" value={employee.workload.weekendWork ? 'Required' : 'Not Required'} />
            <MetricRow label="Travel Frequency" value={employee.workload.businessTravelFrequency} />
            <MetricRow label="Commute Radius" value={`${employee.personal.distanceFromOffice} km`} />
          </div>
        </div>
      </div>

      {/* 3. Workplace Experience Sentiment Indexes */}
      <div className="px-6 pb-6 border-b border-[var(--color-hairline)]">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-[var(--color-rust)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)]">Workplace Experience Sentiment Indexes</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <SentimentCard label="Job Satisfaction" score={employee.environment.jobSatisfaction} />
          <SentimentCard label="Work-Life Balance" score={employee.environment.workLifeBalance} />
          <SentimentCard label="Manager Relation" score={employee.environment.managerRelationship} />
          <SentimentCard label="Recognition Freq." score={employee.environment.recognitionScore} />
        </div>
      </div>

      {analysis && (
        <div className="p-6 border-b border-[var(--color-hairline)] bg-[var(--color-ink-sunken)]/20">
          <div className="border-2 border-[var(--color-kraft)]/40 bg-[var(--color-ink-raised)] shadow-lg rounded-lg p-5">
            {/* Header tag stamp */}
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-hairline)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-kraft)] animate-pulse" />
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-kraft)]">
                Primary Case Drivers & Resignation Factors (SHAP Analysis)
              </div>
            </div>
            
            <div className="space-y-2.5">
              {[...analysis.contributions].sort((a, b) => b.shapValue - a.shapValue).map((c) => {
                const width = Math.min(50, (Math.abs(c.shapValue) / 20) * 50);
                const positive = c.shapValue >= 0;
                return (
                  <div key={c.featureName} className="flex items-center gap-3 text-[11px]">
                    <span className="w-40 shrink-0 text-[var(--color-bone)] truncate">{c.displayName}</span>
                    <div className="flex-1 h-1.5 bg-[var(--color-hairline)] relative">
                      <div
                        className="h-full absolute top-0"
                        style={{
                          width: `${width}%`,
                          backgroundColor: positive ? 'var(--color-rust)' : 'var(--color-teal)',
                          left: positive ? '50%' : `${50 - width}%`,
                        }}
                      />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-bone-faint)]" />
                    </div>
                    <span className="font-mono w-20 text-right text-[var(--color-bone-dim)]">{c.currentValue}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-5 border-t border-[var(--color-hairline)]">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-3">Recommended retention actions</div>
              <ul className="space-y-1.5">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="text-[11.5px] text-[var(--color-bone)] flex gap-2">
                    <span className="text-[var(--color-kraft)]">—</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-[var(--color-hairline)]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)]">What-if simulation</div>
          <button onClick={onResetSingle} className="text-[10px] font-mono text-[var(--color-bone-dim)] hover:text-[var(--color-amber)] cursor-pointer">
            Reset to baseline
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <SliderRow label="Annual salary" value={sim.salary} min={salaryMin} max={salaryMax} step={salaryStep} isCurrency={true} onChange={(v) => setSim((s) => ({ ...s, salary: v }))} />
          <SliderRow label="Overtime hours / wk" value={sim.overtime} min={0} max={25} step={1} onChange={(v) => setSim((s) => ({ ...s, overtime: v }))} />
          <SliderRow label="Work-life balance" value={sim.wlb} min={1} max={5} step={1} suffix="/5" onChange={(v) => setSim((s) => ({ ...s, wlb: v }))} />
          <SliderRow label="Manager relationship" value={sim.mgrRel} min={1} max={5} step={1} suffix="/5" onChange={(v) => setSim((s) => ({ ...s, mgrRel: v }))} />
          <SliderRow label="Job satisfaction" value={sim.jobSat} min={1} max={5} step={1} suffix="/5" onChange={(v) => setSim((s) => ({ ...s, jobSat: v }))} />
          <SliderRow label="Recognition score" value={sim.recognition} min={1} max={5} step={1} suffix="/5" onChange={(v) => setSim((s) => ({ ...s, recognition: v }))} />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onApplySimulation}
            disabled={isSimulating}
            className="px-5 py-2.5 bg-[var(--color-kraft)] hover:bg-[#b87b39] disabled:opacity-50 text-[#14171c] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            {isSimulating ? 'Recalculating…' : 'Recalculate risk'}
          </button>
          <button
            onClick={onResetSingle}
            disabled={isSimulating}
            className="px-5 py-2.5 border border-[var(--color-hairline)] hover:bg-[var(--color-hairline)]/30 text-[var(--color-bone)] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Reset to baseline
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)]">Executive summary</div>
          <button
            onClick={onFetchSummary}
            disabled={isLoadingSummary}
            className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-kraft)] hover:underline disabled:opacity-50 cursor-pointer"
          >
            {isLoadingSummary ? 'Drafting…' : aiSummary ? 'Redraft' : 'Draft summary'}
          </button>
        </div>
        {summaryError && <div className="text-[11px] text-[var(--color-rust)] mb-2">{summaryError}</div>}
        {aiSummary ? (
          <p className="text-[12.5px] leading-relaxed text-[var(--color-bone)] whitespace-pre-line">{aiSummary}</p>
        ) : (
          <p className="text-[11.5px] text-[var(--color-bone-dim)] italic">No summary drafted yet for this file.</p>
        )}
      </div>
    </div>
  );
}
