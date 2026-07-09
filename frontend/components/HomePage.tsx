import React, { useEffect, useState } from 'react';

interface HomePageProps {
  onEnter: () => void;
}

/** Animated floating particle for background */
function Particle({ style }: { style: React.CSSProperties }) {
  return <div style={style} />;
}

export function HomePage({ onEnter }: HomePageProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Build a grid of subtle floating orbs for depth
  const particles = Array.from({ length: 7 }, (_, i) => ({
    id: i,
    style: {
      position: 'absolute' as const,
      borderRadius: '50%',
      background: `radial-gradient(circle, rgba(221, 161, 94, ${0.06 + i * 0.018}) 0%, transparent 70%)`,
      width: `${140 + i * 60}px`,
      height: `${140 + i * 60}px`,
      top: `${[8, 60, 22, 72, 40, 5, 55][i]}%`,
      left: `${[5, 70, 45, 20, 80, 55, 35][i]}%`,
      transform: 'translate(-50%, -50%)',
      animation: `drift-${i % 3} ${6 + i * 1.5}s ease-in-out infinite alternate`,
      pointerEvents: 'none' as const,
    },
  }));

  const stats = [
    { label: 'Precision', value: '94.2%', sub: 'F1-Score' },
    { label: 'Signals', value: '11', sub: 'SHAP Drivers' },
    { label: 'Engine', value: 'Live', sub: 'What-if Ready' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--color-ink-homepage)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Ambient background ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(42,47,56,0.4) 1px, transparent 1px)',
          backgroundSize: '100% 2rem',
          backgroundPosition: '0 4px',
          pointerEvents: 'none',
        }}
      />

      {/* Radial glow centred */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(221, 161, 94, 0.08) 0%, rgba(221, 161, 94, 0.03) 35%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <Particle key={p.id} style={p.style} />
      ))}

      {/* ── Main card ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 640,
          width: '90%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 36,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Logo badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-12px)',
            transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              border: '1.5px solid var(--color-kraft)',
              color: 'var(--color-kraft)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            L
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--color-bone)',
              letterSpacing: '-0.02em',
            }}
          >
            Ledgerline
          </span>
        </div>

        {/* Status pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 16px',
            borderRadius: 9999,
            border: '1px solid rgba(201,138,68,0.25)',
            background: 'rgba(201,138,68,0.06)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-kraft)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-teal)',
              boxShadow: '0 0 6px var(--color-teal)',
              animation: 'pulse 2s infinite',
            }}
          />
          Attrition Risk Console · System Active
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              fontWeight: 600,
              color: 'var(--color-bone)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            Every resignation leaves{' '}
            <em style={{ color: 'var(--color-kraft)', fontStyle: 'italic' }}>a paper trail</em>{' '}
            before it happens.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--color-bone-dim)',
              lineHeight: 1.7,
              margin: '0 auto',
              maxWidth: 480,
            }}
          >
            Ledgerline reads a roster the way a caseworker reads a file — compensation, workload,
            tenure, and sentiment — and surfaces each person's flight-risk score before the
            conversation stops happening.
          </p>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderTop: '1px solid var(--color-hairline)',
            borderBottom: '1px solid var(--color-hairline)',
            padding: '20px 0',
            width: '100%',
            justifyContent: 'space-around',
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                alignItems: 'center',
                borderLeft: i === 0 ? 'none' : '1px solid var(--color-hairline)',
                flex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-bone-dim)',
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'var(--color-kraft)',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.value}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--color-bone-faint)',
                  letterSpacing: '0.08em',
                }}
              >
                {s.sub}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <button
            id="home-enter-btn"
            onClick={onEnter}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              padding: '16px 44px',
              background: hovered
                ? 'linear-gradient(135deg, var(--color-kraft-dim) 0%, #bc8a50 100%)'
                : 'linear-gradient(135deg, var(--color-kraft) 0%, var(--color-kraft-dim) 100%)',
              color: 'var(--color-kraft-fg)',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              transition: 'all 0.25s ease',
              transform: hovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hovered
                ? '0 8px 32px rgba(221, 161, 94, 0.35), 0 2px 8px rgba(221, 161, 94, 0.2)'
                : '0 4px 20px rgba(221, 161, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 220,
              justifyContent: 'center',
            }}
          >
            <span>Enter the Console</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.25s ease',
                transform: hovered ? 'translateX(3px)' : 'translateX(0)',
              }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <p
            style={{
              fontSize: 10,
              color: 'var(--color-bone-faint)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            Upload a roster CSV or use the sample template to get started
          </p>
        </div>
      </div>

      {/* ── Bottom footer strip ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-bone-faint)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.8s ease 0.4s',
        }}
      >
        <span>Risk Scoring</span>
        <span style={{ color: 'var(--color-hairline)' }}>·</span>
        <span>Department Ledger</span>
        <span style={{ color: 'var(--color-hairline)' }}>·</span>
        <span>AI Casework</span>
        <span style={{ color: 'var(--color-hairline)' }}>·</span>
        <span>What-if Simulation</span>
      </div>

      {/* ── Keyframe styles injected inline ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes drift-0 {
          from { transform: translate(-50%, -50%) scale(1); }
          to   { transform: translate(-50%, -50%) scale(1.12) translate(12px, -8px); }
        }
        @keyframes drift-1 {
          from { transform: translate(-50%, -50%) scale(1); }
          to   { transform: translate(-50%, -50%) scale(0.9) translate(-10px, 14px); }
        }
        @keyframes drift-2 {
          from { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          to   { transform: translate(-50%, -50%) scale(1.08) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
