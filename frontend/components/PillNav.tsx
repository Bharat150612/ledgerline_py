import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './PillNav.css';

export interface PillNavItem {
  label: string;
  id: string;
  disabled?: boolean;
}

interface PillNavProps {
  logoLabel?: string;
  items: PillNavItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  className?: string;
  ease?: string;
  baseColor?: string;
  pillColor?: string;
  hoveredPillTextColor?: string;
  pillTextColor?: string;
  activeColor?: string;
  initialLoadAnimation?: boolean;
  /** Extra slot rendered on the right side of the pill bar (e.g. theme toggle) */
  rightSlot?: React.ReactNode;
}

const PillNav: React.FC<PillNavProps> = ({
  logoLabel = 'L',
  items,
  activeId,
  onSelect,
  className = '',
  ease = 'power3.out',
  baseColor = 'rgba(111,118,246,0.06)',
  pillColor = '#11131f',
  hoveredPillTextColor = '#ffffff',
  pillTextColor,
  activeColor = '#6f76f6',
  initialLoadAnimation = true,
  rightSlot,
}) => {
  const resolvedPillTextColor = pillTextColor ?? '#94a3b8';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs = useRef<gsap.core.Timeline[]>([]);
  const activeTweenRefs = useRef<gsap.core.Tween[]>([]);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        if (w === 0 || h === 0) return;

        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        const label = pill.querySelector('.pill-label') as HTMLElement | null;
        const hover = pill.querySelector('.pill-label-hover') as HTMLElement | null;

        if (label) gsap.set(label, { y: 0 });
        if (hover) gsap.set(hover, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
        if (hover) {
          gsap.set(hover, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(hover, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
        }
        tlRefs.current[index] = tl;
      });
    };

    layout();
    window.addEventListener('resize', layout);
    document.fonts?.ready.then(layout).catch(() => {});

    const menu = mobileMenuRef.current;
    if (menu) gsap.set(menu, { visibility: 'hidden', opacity: 0 });

    if (initialLoadAnimation) {
      const logo = logoRef.current;
      const navItems = navItemsRef.current;
      if (logo) {
        gsap.set(logo, { scale: 0 });
        gsap.to(logo, { scale: 1, duration: 0.5, ease });
      }
      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: 'hidden' });
        gsap.to(navItems, { width: 'auto', duration: 0.5, ease });
      }
    }

    return () => window.removeEventListener('resize', layout);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' }) as gsap.core.Tween;
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' }) as gsap.core.Tween;
  };

  const toggleMobileMenu = () => {
    const next = !isMobileMenuOpen;
    setIsMobileMenuOpen(next);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (next) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.25, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.25, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.25, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.25, ease });
      }
    }

    if (menu) {
      if (next) {
        gsap.set(menu, { visibility: 'visible' });
        gsap.fromTo(menu, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease });
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 8,
          duration: 0.18,
          ease,
          onComplete: () => gsap.set(menu, { visibility: 'hidden' }),
        });
      }
    }
  };

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': resolvedPillTextColor,
    '--pill-active-bg': activeColor,
  } as React.CSSProperties;

  return (
    <div className="pill-nav-wrapper">
      <div className="pill-nav-container" style={{ position: 'relative' }}>
        <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
          {/* Logo Button */}
          <button
            ref={logoRef}
            className="pill-logo-btn"
            onClick={() => onSelect('home')}
            aria-label="Home"
            style={{ color: resolvedPillTextColor, fontFamily: 'Syne, sans-serif', fontSize: '1.1rem' }}
          >
            {logoLabel}
          </button>

          {/* Desktop Nav Items */}
          <div className="pill-nav-items desktop-only" ref={navItemsRef}>
            <ul className="pill-list" role="menubar">
              {items.map((item, i) => (
                <li key={item.id} role="none">
                  <button
                    role="menuitem"
                    className={`pill${activeId === item.id ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`}
                    onClick={() => !item.disabled && onSelect(item.id)}
                    onMouseEnter={() => !item.disabled && handleEnter(i)}
                    onMouseLeave={() => !item.disabled && handleLeave(i)}
                    aria-label={item.label}
                    disabled={item.disabled}
                  >
                    <span
                      className="hover-circle"
                      aria-hidden="true"
                      ref={(el) => { circleRefs.current[i] = el; }}
                    />
                    <span className="label-stack">
                      <span className="pill-label">{item.label}</span>
                      <span className="pill-label-hover" aria-hidden="true">{item.label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right slot (theme toggle, etc.) */}
          {rightSlot && (
            <div className="desktop-only" style={{ marginLeft: 6 }}>
              {rightSlot}
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            className="mobile-menu-button mobile-only"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            ref={hamburgerRef}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </nav>

        {/* Mobile Dropdown */}
        <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
          <ul className="mobile-menu-list">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  className={`mobile-menu-link${activeId === item.id ? ' is-active' : ''}`}
                  onClick={() => {
                    if (!item.disabled) {
                      onSelect(item.id);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                >
                  {item.label}
                </button>
              </li>
            ))}
            {rightSlot && (
              <li style={{ padding: '4px 8px 8px' }}>{rightSlot}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PillNav;
