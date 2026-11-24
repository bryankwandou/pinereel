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
  AnimatePresence,
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
  const reduce = useSafeReducedMotion();
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
  const reduce = useSafeReducedMotion();
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
  const reduce = useSafeReducedMotion();

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

export function CountUpMetric({
  value,
  suffix = '',
  prefix = '',
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const reduce = useSafeReducedMotion();
  return (
    <motion.span
      initial={reduce ? false : { opacity: 0.65, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="pr-mono inline-block"
    >
      {prefix}
      {value}
      {suffix}
    </motion.span>
  );
}

export function StrikeThroughSweep({
  children,
  delayMs = 420,
}: {
  children: ReactNode;
  delayMs?: number;
}) {
  const reduce = useSafeReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <span className="relative inline-block">
      {children}
      {mounted && !reduce && (
        <motion.span
          aria-hidden="true"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.45, delay: delayMs / 1000, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] opacity-80 origin-left rounded-full pointer-events-none"
          style={{ background: 'var(--pr-bad)' }}
        />
      )}
    </span>
  );
}

export function ScrollRise({
  children,
  className = '',
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const reduce = useSafeReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial={{ y: 14 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.42, delay: delayMs / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const CYCLING_SOURCES = [
  'YouTube MP4 & Shorts',
  'Instagram Reels MP4',
  'X (Twitter) HD MP4',
  'TikTok No-Watermark MP4',
  'Facebook & LinkedIn MP4',
  'TED & External Web MP4',
  'Vimeo, Reddit & HLS',
];

export function LiveSourceFlipper() {
  const reduce = useSafeReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % CYCLING_SOURCES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--pr-r-pill)] border border-[var(--pr-signal-rule)] bg-[var(--pr-signal-wash)] text-xs font-semibold text-[var(--pr-signal)] overflow-hidden">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--pr-signal)] animate-pulse" aria-hidden="true" />
      <span className="pr-mono text-[11px] uppercase tracking-wider text-[var(--pr-ink-2)]">
        LIVE SOURCE:
      </span>
      <span className="relative inline-flex items-center min-w-[165px] h-4 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.span
            key={CYCLING_SOURCES[index]}
            initial={reduce ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: -14, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 flex items-center pr-mono text-xs font-semibold text-[var(--pr-signal)] whitespace-nowrap"
          >
            {CYCLING_SOURCES[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

export function PerspectiveTiltCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useSafeReducedMotion();
  const rotX = useSpring(0, { stiffness: 160, damping: 20 });
  const rotY = useSpring(0, { stiffness: 160, damping: 20 });

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div style={{ perspective: '1100px' }} className={className}>
      <motion.div
        style={{
          rotateX: rotX,
          rotateY: rotY,
          transformStyle: 'preserve-3d',
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return;
          const rect = e.currentTarget.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width - 0.5;
          const ny = (e.clientY - rect.top) / rect.height - 0.5;
          rotY.set(nx * 7);
          rotX.set(-ny * 7);
        }}
        onPointerLeave={() => {
          rotX.set(0);
          rotY.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function AnimatedScoreRing({
  score,
  verdict,
}: {
  score: number;
  verdict: 'SAFE' | 'CAUTION' | 'BLOCKED';
}) {
  const reduce = useSafeReducedMotion();
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const strokeColor =
    verdict === 'SAFE'
      ? 'var(--pr-good)'
      : verdict === 'CAUTION'
        ? 'var(--pr-warn)'
        : 'var(--pr-bad)';

  return (
    <div className="relative inline-flex items-center justify-center w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="var(--pr-rule)"
          strokeWidth="4.5"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={reduce ? { duration: 0.01 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center pr-mono text-sm font-semibold text-[var(--pr-ink)]">
        {clamped}
      </span>
    </div>
  );
}

export function KineticBeamDivider({ className = '' }: { className?: string }) {
  const reduce = useSafeReducedMotion();
  return (
    <div
      aria-hidden="true"
      className={`relative h-px w-full bg-[var(--pr-rule)] overflow-hidden ${className}`}
    >
      {!reduce && (
        <motion.span
          className="absolute top-0 left-0 h-full w-40"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--pr-signal), transparent)',
          }}
          animate={{ x: ['-160px', '1280px'] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
        />
      )}
    </div>
  );
}

export function StaggerGroup({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useSafeReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.055 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useSafeReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0.82, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
