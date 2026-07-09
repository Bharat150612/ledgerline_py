import React from 'react';
import { Tab } from './Sidebar.js';
import { downloadSampleCSVTemplate } from '../services/csvHelper.js';

interface LandingProps {
  hasData: boolean;
  onNavigate: (t: Tab) => void;
  activeTab: Tab;
  onSelect: (t: Tab) => void;
}

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    tag: 'Risk Engine',
    title: 'Weighted Attrition Scoring',
    body: 'Every employee record is scored against 11 SHAP-derived signals — overtime load, salary gap vs. market, tenure, manager relationship, job satisfaction, and travel pattern. The result is a probability score (0–100%) with a risk tier: Critical, High, Medium, or Low.',
    action: null,
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    tag: 'Department Ledger',
    title: 'Division-Level Pressure Map',
    body: 'Individual scores roll up to department level so heads of division can see where risk is concentrated. Each department shows average flight-risk, headcount at each tier, and the top contributing factor driving the reading.',
    action: { label: 'View Departments', tab: 'departments' as Tab },
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    tag: 'Personnel Files',
    title: 'Individual Case Review',
    body: 'Open any employee\'s file to see a full breakdown of their risk drivers, a ranked SHAP factor chart, and an AI-drafted plain-language executive summary. Run what-if simulations — adjust salary, overtime, or satisfaction — and see the recalculated risk instantly.',
    action: { label: 'Open Directory', tab: 'directory' as Tab },
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    tag: 'AI Predictor',
    title: 'Leave-Reason Interpretation',
    body: 'Select any employee and the AI drafter reads their profile — compensation shortfall, workload patterns, satisfaction signals — and writes a concise narrative explaining the most likely reason they would resign and what intervention could change the outcome.',
    action: { label: 'Open Predictor', tab: 'reason_predictor' as Tab },
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload a roster',
    body: 'Drop a CSV or Excel export on the Intake page. The system expects columns for compensation, workload, environment, and employment details.',
  },
  {
    step: '02',
    title: 'Scores are calculated',
    body: 'On import, every record is scored by the attrition model. Risk tiers and SHAP factor rankings are calculated server-side and stored in the ledger.',
  },
  {
    step: '03',
    title: 'Analyse & intervene',
    body: 'Browse the global ledger, drill into departments, open individual files, run simulations, and generate AI narratives — all without leaving the console',
  },
];

export function Landing({ hasData, onNavigate, activeTab, onSelect }: LandingProps) {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>

      {/* ── Page hero header (matches screenshot) ── */}
      <div className="py-16 md:py-24 flex flex-col items-center text-center">
        {/* Status Pill Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 9999,
            border: '1px solid rgba(221, 161, 94, 0.25)',
            background: 'rgba(221, 161, 94, 0.08)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-kraft)',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-teal)',
              boxShadow: '0 0 8px var(--color-teal)',
            }}
          />
          SYSTEM ACTIVE — ATTRITION RISK CONSOLE
        </div>

        {/* Hero Title */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 6vw, 4.4rem)',
            fontWeight: 800,
            color: 'var(--color-bone)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            margin: '0 auto 20px',
            maxWidth: 750,
          }}
        >
          Predict Attrition.<br />
          <span style={{ color: 'var(--color-kraft)', fontStyle: 'italic', fontWeight: 600 }}>Protect Talent.</span>
        </h1>

        {/* Hero Subtitle */}
        <p
          style={{
            fontSize: 15,
            color: 'var(--color-bone-dim)',
            lineHeight: 1.7,
            margin: '0 auto 36px',
            maxWidth: 620,
          }}
        >
          Ledgerline reads a roster the way a caseworker reads a file —
          compensation, workload, tenure, and sentiment — then assigns each
          person a flight-risk reading and recommended action.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <button
            id="landing-primary-cta"
            onClick={() => onNavigate(hasData ? 'overview' : 'upload')}
            style={{
              padding: '12px 28px',
              background: 'var(--color-kraft)',
              color: 'var(--color-kraft-fg)',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 18px rgba(221, 161, 94, 0.25)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.background = 'var(--color-kraft-dim)';
              (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.background = 'var(--color-kraft)';
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {hasData ? 'Open Ledger' : 'Start an Intake →'}
          </button>
          <button
            onClick={downloadSampleCSVTemplate}
            style={{
              padding: '12px 28px',
              background: 'var(--color-ink-sunken)',
              color: 'var(--color-bone)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              const btn = e.target as HTMLButtonElement;
              btn.style.borderColor = 'var(--color-kraft-dim)';
              btn.style.background = 'rgba(221, 161, 94, 0.08)';
            }}
            onMouseLeave={e => {
              const btn = e.target as HTMLButtonElement;
              btn.style.borderColor = 'var(--color-hairline)';
              btn.style.background = 'var(--color-ink-sunken)';
            }}
          >
            Download Template
          </button>
        </div>
      </div>

      {/* ── Feature cards ── */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--color-bone)',
          letterSpacing: '-0.01em',
          margin: '0 0 16px',
        }}
      >
        Core capabilities
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 44,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.tag}
            style={{
              background: 'var(--color-ink-raised)',
              border: '1px solid var(--color-hairline)',
              borderRadius: 12,
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              transition: 'all 0.22s ease',
              cursor: f.action && hasData ? 'pointer' : 'default',
            }}
            onClick={() => f.action && hasData && onNavigate(f.action.tab)}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = 'var(--color-kraft-dim)';
              el.style.transform = 'translateY(-2px)';
              el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.18)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = 'var(--color-hairline)';
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
          >
            {/* Icon + tag */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-kraft)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(201,138,68,0.2)',
                  background: 'rgba(201,138,68,0.06)',
                }}
              >
                {f.tag}
              </span>
              <div
                style={{
                  padding: 7,
                  borderRadius: 7,
                  background: 'var(--color-ink-sunken)',
                  border: '1px solid var(--color-hairline)',
                  color: 'var(--color-kraft)',
                }}
              >
                {f.icon}
              </div>
            </div>

            {/* Text */}
            <div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--color-bone)',
                  margin: '0 0 8px',
                  letterSpacing: '-0.01em',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--color-bone-dim)',
                  lineHeight: 1.72,
                  margin: 0,
                }}
              >
                {f.body}
              </p>
            </div>

            {/* Optional nav link */}
            {f.action && (
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: hasData ? 'var(--color-kraft)' : 'var(--color-bone-faint)',
                }}
              >
                {f.action.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {!hasData && (
                  <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', color: 'var(--color-bone-faint)', fontSize: 10 }}>
                    — upload first
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--color-bone)',
          letterSpacing: '-0.01em',
          margin: '0 0 16px',
        }}
      >
        How it works
      </h2>
      <div
        style={{
          border: '1px solid var(--color-hairline)',
          borderRadius: 12,
          padding: '28px 32px',
          background: 'var(--color-ink-raised)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 32,
          position: 'relative',
        }}
      >
        {HOW_IT_WORKS.map((s, i) => (
          <div key={s.step} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--color-ink)',
                  border: '1px solid var(--color-hairline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--color-kraft)',
                  flexShrink: 0,
                }}
              >
                {s.step}
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: 'var(--color-hairline)' }} />
              )}
            </div>
            <h4
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-bone)',
                margin: 0,
              }}
            >
              {s.title}
            </h4>
            <p style={{ fontSize: 12, color: 'var(--color-bone-dim)', lineHeight: 1.7, margin: 0 }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tech stats strip ── */}
      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid var(--color-hairline)',
          borderBottom: '1px solid var(--color-hairline)',
          padding: '20px 0',
          gap: 0,
        }}
        className="kpi-strip"
      >
        {[
          { label: 'Records Scored', value: hasData ? 'Active' : 'Pending', detail: 'Employee Ledger', isAccent: true },
          { label: 'F1 Accuracy', value: '94.2%', detail: 'ML Engine Score', isAccent: false },
          { label: 'SHAP Drivers', value: '11 Factors', detail: 'Attribution Model', isAccent: false },
          { label: 'What-if Engine', value: 'Ready', detail: 'Attribution Slider', isAccent: true },
        ].map((kpi, i) => (
          <div
            key={kpi.label}
            style={{
              paddingLeft: i === 0 ? 0 : 20,
              borderLeft: i === 0 ? 'none' : '1px solid var(--color-hairline)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--color-bone-dim)',
              }}
            >
              {kpi.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 800,
                color: kpi.isAccent ? 'var(--color-kraft)' : 'var(--color-bone)',
                letterSpacing: '-0.02em',
              }}
            >
              {kpi.value}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--color-bone-faint)',
                letterSpacing: '0.06em',
              }}
            >
              {kpi.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
