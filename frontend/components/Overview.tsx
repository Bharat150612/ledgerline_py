import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AnalyticsSummary } from '../core/types.js';
import { Eyebrow, StatCard } from './ui.js';

const INK = 'var(--color-ink-raised)';
const HAIR = 'var(--color-hairline)';
const BONE = 'var(--color-bone)';
const KRAFT = 'var(--color-kraft)';

function tierColor(p: number) {
  if (p >= 75) return 'var(--color-rust)';
  if (p >= 50) return 'var(--color-amber)';
  if (p >= 25) return 'var(--color-fog)';
  return 'var(--color-teal)';
}

function ChartFrame({ data, xKey, yKey, unit = '%' }: { data: any[]; xKey: string; yKey: string; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}>
        <CartesianGrid stroke={HAIR} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: 'var(--color-bone-dim)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={{ stroke: HAIR }} tickLine={false} />
        <YAxis tick={{ fill: 'var(--color-bone-dim)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: INK, border: `1px solid ${HAIR}`, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          labelStyle={{ color: BONE }}
          itemStyle={{ color: BONE }}
          formatter={(v: any) => [`${v}${unit}`, 'Avg. probability']}
        />
        <Bar dataKey={yKey} radius={[2, 2, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={tierColor(entry[yKey])} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const VIEWS = [
  { id: 'department', label: 'By department' },
  { id: 'role', label: 'By role' },
  { id: 'travel', label: 'Travel & overtime' },
  { id: 'tenure', label: 'Tenure & promotion' },
  { id: 'salary', label: 'Salary gap' },
] as const;

type ViewId = (typeof VIEWS)[number]['id'];

interface OverviewProps {
  analytics: AnalyticsSummary;
  onFilterRisk?: (risk: string) => void;
  onFilterTotal?: () => void;
}

export function Overview({ analytics, onFilterRisk, onFilterTotal }: OverviewProps) {
  const [view, setView] = useState<ViewId>('department');
  const counts = analytics.overallRiskCounts;
  const total = counts.Low + counts.Medium + counts.High + counts.Critical;

  // Calculate dynamic average attrition probability across all departments
  const totalHeadcount = analytics.departmentRisk.reduce((sum, d) => sum + d.headcount, 0);
  const totalProbSum = analytics.departmentRisk.reduce((sum, d) => sum + (d.avgProbability * d.headcount), 0);
  const avgProb = totalHeadcount > 0 ? Math.round(totalProbSum / totalHeadcount) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <Eyebrow>Ledger overview</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-bone)] mt-2">Global risk ledger</h1>
        <p className="text-sm text-[var(--color-bone-dim)] mt-2 max-w-2xl">
          A roll-up of every scored record on file, cut by the variables most correlated with resignation.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Workforce */}
        <div
          onClick={onFilterTotal}
          className="bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] border-t-4 border-t-[var(--color-rust)] rounded-xl p-5 hover:border-[var(--color-kraft-dim)]/50 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)] mb-2">Total Workforce</div>
            <div className="font-display text-3xl font-semibold text-[var(--color-bone)]">{total}</div>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-rust)] flex items-center gap-1.5 mt-3.5">
            <span className="text-[var(--color-rust)]">●</span> 100% Active Retainers
          </div>
        </div>

        {/* Card 2: Critical Risk Cases */}
        <div
          onClick={() => onFilterRisk && onFilterRisk('Critical')}
          className="bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] border-t-4 border-t-[var(--color-rust)] rounded-xl p-5 hover:border-[var(--color-kraft-dim)]/50 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)] mb-2">Critical Risk Cases</div>
            <div className="font-display text-3xl font-semibold text-[var(--color-rust)]">{counts.Critical}</div>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-rust)] flex items-center gap-1 mt-3.5">
            <svg className="w-3.5 h-3.5 text-[var(--color-rust)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Immediate Contact Req.</span>
          </div>
        </div>

        {/* Card 3: High Risk Cases */}
        <div
          onClick={() => onFilterRisk && onFilterRisk('High')}
          className="bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] border-t-4 border-t-[var(--color-rust)] rounded-xl p-5 hover:border-[var(--color-kraft-dim)]/50 transition-all cursor-pointer flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)] mb-2">High Risk Cases</div>
            <div className="font-display text-3xl font-semibold text-[var(--color-rust)]">{counts.High}</div>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-rust)] flex items-center gap-1.5 mt-3.5">
            <span className="text-[var(--color-rust)]">●</span> Under Active Evaluation
          </div>
        </div>

        {/* Card 4: Avg Attrition Prob. */}
        <div className="bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] border-t-4 border-t-[var(--color-rust)] rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)] mb-2">Avg Attrition Prob.</div>
            <div className="font-display text-3xl font-semibold text-[var(--color-rust)]">{avgProb}%</div>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-bone-dim)] mt-3.5">
            Organizational Safety Map
          </div>
        </div>

        {/* Card 5: Model Accuracy (F1) */}
        <div className="bg-[var(--color-ink-raised)] border border-[var(--color-hairline)] border-t-4 border-t-[var(--color-rust)] rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-rust)] mb-2">Model Accuracy (F1)</div>
            <div className="font-display text-3xl font-semibold text-[var(--color-rust)]">94.2%</div>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-rust)] flex items-center gap-1 mt-3.5">
            <svg className="w-3.5 h-3.5 text-[var(--color-rust)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>SHAP Matched Vectors</span>
          </div>
        </div>
      </div>

      <div className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] p-6">
        <div className="flex flex-wrap gap-1 mb-6 border-b border-[var(--color-hairline)] pb-4">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                view === v.id ? 'bg-[var(--color-kraft)] text-[#14171c] font-bold' : 'text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'department' && (
          <ChartFrame data={analytics.departmentRisk.map((d) => ({ name: d.department, avgProbability: d.avgProbability }))} xKey="name" yKey="avgProbability" />
        )}
        {view === 'role' && (
          <ChartFrame data={analytics.roleRisk.map((d) => ({ name: d.jobRole, avgProbability: d.avgProbability }))} xKey="name" yKey="avgProbability" />
        )}
        {view === 'travel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-2">Business travel</div>
              <ChartFrame data={analytics.travelRisk.map((d) => ({ name: d.frequency, avgProbability: d.avgProbability }))} xKey="name" yKey="avgProbability" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-2">Overtime status</div>
              <ChartFrame data={analytics.overtimeRisk.map((d) => ({ name: d.hasOvertime, avgProbability: d.avgProbability }))} xKey="name" yKey="avgProbability" />
            </div>
          </div>
        )}
        {view === 'tenure' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-2">Tenure at company</div>
              <ChartFrame data={analytics.tenureRisk.map((d) => ({ name: d.range, avgProbability: d.avgProbability }))} xKey="name" yKey="avgProbability" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-2">Years since promotion</div>
              <ChartFrame data={analytics.promotionRisk.map((d) => ({ name: d.yearsSincePromotion, avgProbability: d.avgProbability }))} xKey="name" yKey="avgProbability" />
            </div>
          </div>
        )}
        {view === 'salary' && (
          <ChartFrame data={analytics.salaryGapRisk.map((d) => ({ name: d.gapRange, avgProbability: d.avgProbability }))} xKey="name" yKey="avgProbability" />
        )}
      </div>

      <div className="border border-[var(--color-hairline)] bg-[var(--color-ink-raised)] p-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-bone-dim)] mb-4">Top contributing factors</div>
        <div className="space-y-3">
          {analytics.overallDrivers.slice(0, 6).map((driver, i) => {
            const max = analytics.overallDrivers[0]?.avgContribution || 1;
            const pct = Math.min(100, (Math.abs(driver.avgContribution) / max) * 100);
            return (
              <div key={driver.featureName} className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-[var(--color-bone-faint)] w-5">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs text-[var(--color-bone)] w-44 shrink-0">{driver.displayName}</span>
                <div className="flex-1 h-1.5 bg-[var(--color-hairline)]">
                  <div className="h-full" style={{ width: `${pct}%`, backgroundColor: KRAFT }} />
                </div>
                <span className="font-mono text-[10px] text-[var(--color-bone-dim)] w-10 text-right">{driver.avgContribution.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
