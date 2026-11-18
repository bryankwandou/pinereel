'use client';

/**
 * Motion primitives for PineReel:
 * - ReadingProgress: sticky scroll-linked top hairline
 * - PointerGlow: subtle fine-pointer ambient radial field (adapted from skiper61)
 * - KineticLine: Intl.Segmenter word-level masked reveal (never hides content without JS)
 * - CssLink: directional CSS underline reveal (adapted from skiper40, token-scoped)
 * - Magnetic: fine-pointer spring pull capped at 8px
 * - SpringTabs: layoutId pill selector
 */

import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

export function useSafeReducedMotion(): boolean {
  const raw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(raw);
}

export function ReadingProgress() {
  const reduce = useSafeReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 h-[2px] origin-left bg-[var(--pr-signal)] pointer-events-none"
      style={{ scaleX, zIndex: 'var(--z-progress)' }}
    />
  );
}

export function PointerGlow() {
  const reduce = useSafeReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const rawX = useMotionValue(-400);
  const rawY = useMotionValue(-400);
  const x = useSpring(rawX, { stiffness: 120, damping: 24 });
  const y = useSpring(rawY, { stiffness: 120, damping: 24 });

  useEffect(() => {
    if (reduce) return;
    const mq = window.matchMedia('(pointer: fine)');
    setFinePointer(mq.matches);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      rawX.set(e.clientX - 240);
      rawY.set(e.clientY - 240);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, rawX, rawY]);

  if (reduce || !finePointer) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 w-[480px] h-[480px] rounded-full pointer-events-none"
      style={{
        x,
        y,
        zIndex: 0,
        background:
          'radial-gradient(circle, color-mix(in srgb, var(--pr-signal) 8%, transparent) 0%, transparent 68%)',
      }}
    />
  );
}

function segmentWords(text: string, locale: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter(locale, { granularity: 'word' });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return text.split(/(\s+)/);
}

export function KineticLine({
  text,
  locale = 'en',
  accent = false,
  baseDelayMs = 0,
}: {
  text: string;
  locale?: string;
  accent?: boolean;
  baseDelayMs?: number;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tokens = useMemo(() => segmentWords(text, locale), [text, locale]);

  if (!mounted || reduce) {
    return accent ? <em>{text}</em> : <span>{text}</span>;
  }

  return (
    <span className="relative inline">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={accent ? 'italic text-[var(--pr-signal)]' : undefined}>
        {tokens.map((tok, idx) => {
          if (/^\s+$/.test(tok)) {
            return <span key={`sp-${idx}`}>{tok}</span>;
          }
          const delay = Math.min(480, baseDelayMs + idx * 36);
          return (
            <span
              key={`w-${idx}-${tok}`}
              className="inline-block overflow-hidden align-bottom"
            >
              <motion.span
                className="inline-block"
                initial={{ y: '105%' }}
                animate={{ y: '0%' }}
                transition={{
                  duration: 0.44,
                  delay: delay / 1000,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {tok}
              </motion.span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

export function CssLink({
  href,
  children,
  external = false,
  active = false,
  center = false,
  className = '',
  onClick,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  active?: boolean;
  center?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`sk-link ${className}`}
        data-dir={center ? 'center' : 'left'}
        onClick={onClick}
      >
        <span>{children}</span>
        <ArrowUpRight size={13} strokeWidth={1.8} aria-hidden="true" />
      </a>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`sk-link ${className}`}
      data-dir={center ? 'center' : 'left'}
      onClick={onClick}
    >
      <span>{children}</span>
    </Link>
  );
}

export function Magnetic({
  children,
  strength = 0.2,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 170, damping: 16 });
  const y = useSpring(0, { stiffness: 170, damping: 16 });

  if (reduce) {
    return <span style={{ display: 'inline-block' }}>{children}</span>;
  }

  return (
    <motion.span
      style={{ x, y, display: 'inline-block' }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = Math.max(-8, Math.min(8, (e.clientX - (rect.left + rect.width / 2)) * strength));
        const dy = Math.max(-8, Math.min(8, (e.clientY - (rect.top + rect.height / 2)) * strength));
        x.set(dx);
        y.set(dy);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

export function SpringTabs<T extends string>({
  id,
  options,
  value,
  onChange,
  label,
}: {
  id: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 p-1 rounded-[var(--pr-r)] border border-[var(--pr-rule)] bg-[var(--pr-sunken)]"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className="relative px-3 py-1.5 text-sm font-medium rounded-[var(--pr-r-sm)] cursor-pointer transition-colors"
            style={{
              color: selected ? 'var(--pr-ink)' : 'var(--pr-ink-3)',
              background: 'transparent',
              border: 0,
            }}
          >
            {selected && (
              <motion.span
                layoutId={`tab-${id}`}
                transition={reduce ? { duration: 0.01 } : { type: 'spring', stiffness: 360, damping: 30 }}
                className="absolute inset-0 rounded-[var(--pr-r-sm)] bg-[var(--pr-raised)] border border-[var(--pr-rule)]"
                style={{ zIndex: 0, boxShadow: 'var(--pr-e1)' }}
                aria-hidden="true"
              />
            )}
            <span className="relative" style={{ zIndex: 1 }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
