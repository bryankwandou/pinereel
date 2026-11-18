'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, ShieldOff, Sparkles } from 'lucide-react';
import { sanitizeAndInspectUrl } from '@/lib/shared/safety';

const TEST_PAYLOADS = [
  {
    id: 'trackers',
    label: 'YouTube + Ad Trackers',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ&utm_source=social&fbclid=ad123&si=track99',
  },
  {
    id: 'adunwrap',
    label: 'Ad Wrapper -> Video',
    url: 'https://ads.doubleclick.net/clk?adurl=https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  },
  {
    id: 'generalnews',
    label: 'General Video (No False Block)',
    url: 'youtube.com/watch?v=aqz-KE-bpKQ&slot=1&city=bandar',
  },
  {
    id: 'malware',
    label: 'Standalone Ad Malware (.apk)',
    url: 'https://ads.doubleclick.net/slot-gacor-bonus.apk',
  },
];

export function ThreatSimulator() {
  const reduce = useReducedMotion();
  const [rawUrl, setRawUrl] = useState(TEST_PAYLOADS[0].url);
  const report = useMemo(() => sanitizeAndInspectUrl(rawUrl), [rawUrl]);

  const barColor =
    report.verdict === 'SAFE'
      ? 'var(--pr-good)'
      : report.verdict === 'CAUTION'
      ? 'var(--pr-warn)'
      : 'var(--pr-bad)';

  return (
    <div className="pr-card p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="pr-kicker">LIVE URL ANATOMY SANDBOX</span>
          <h2 className="pr-h2 mt-1">Watch PineReel dissect trackers, lures, and SSRF traps live.</h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`pr-badge ${
              report.verdict === 'SAFE'
                ? 'pr-badge--good'
                : report.verdict === 'CAUTION'
                ? 'pr-badge--warn'
                : 'pr-badge--bad'
            }`}
          >
            {report.verdict === 'SAFE' ? (
              <ShieldCheck size={12} aria-hidden="true" />
            ) : report.verdict === 'CAUTION' ? (
              <ShieldAlert size={12} aria-hidden="true" />
            ) : (
              <ShieldOff size={12} aria-hidden="true" />
            )}
            <span>
              {report.verdict} · {report.score}/100
            </span>
          </span>
        </div>
      </div>

      {/* Payload presets */}
      <div className="flex flex-wrap gap-2">
        {TEST_PAYLOADS.map((p) => {
          const active = rawUrl === p.url;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setRawUrl(p.url)}
              className="px-3 py-1.5 rounded-[var(--pr-r-pill)] text-xs font-semibold border cursor-pointer transition-colors"
              style={{
                background: active ? 'var(--pr-signal-wash)' : 'var(--pr-sunken)',
                borderColor: active ? 'var(--pr-signal)' : 'var(--pr-rule)',
                color: active ? 'var(--pr-signal)' : 'var(--pr-ink-2)',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Editable sandbox URL */}
      <div className="pr-input-wrap">
        <input
          type="text"
          value={rawUrl}
          onChange={(e) => setRawUrl(e.target.value)}
          aria-label="Test any URL against the 5-layer shield"
          className="pr-input pr-mono text-sm"
        />
      </div>

      {/* Animated Score Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs pr-mono text-[var(--pr-ink-3)]">
          <span>PRE-FLIGHT INTEGRITY METER</span>
          <span>{report.score} / 100</span>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--pr-sunken)] overflow-hidden border border-[var(--pr-rule)]">
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${report.score}%`, backgroundColor: barColor }}
            transition={reduce ? { duration: 0.01 } : { type: 'spring', stiffness: 200, damping: 26 }}
          />
        </div>
      </div>

      {/* Live Token Dissection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="pr-sunken p-4 space-y-2.5">
          <span className="text-xs font-semibold text-[var(--pr-ink-2)] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[var(--pr-signal)]" aria-hidden="true" />
            Sanitized Canonical Output
          </span>
          <code className="block text-xs pr-mono break-all text-[var(--pr-ink)]">
            {report.sanitizedUrl || 'BLOCKED -- Rejected before canonicalization'}
          </code>

          <AnimatePresence mode="popLayout">
            {report.strippedParams.length > 0 && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap gap-1.5 pt-1"
              >
                {report.strippedParams.map((param) => (
                  <span
                    key={param}
                    className="px-2 py-0.5 rounded-[var(--pr-r-sm)] bg-[var(--pr-warn-wash)] border border-[var(--pr-warn-rule)] text-[11px] pr-mono text-[var(--pr-warn)] line-through"
                  >
                    {param}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {report.reasons.map((r) => (
              <motion.div
                key={r.code}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="p-2.5 rounded-[var(--pr-r-sm)] border border-[var(--pr-rule)] bg-[var(--pr-paper)] flex items-start gap-2.5 text-xs"
              >
                <span
                  className={`pr-badge shrink-0 ${
                    r.severity === 'pass'
                      ? 'pr-badge--good'
                      : r.severity === 'warn'
                      ? 'pr-badge--warn'
                      : 'pr-badge--bad'
                  }`}
                >
                  {r.severity}
                </span>
                <div>
                  <span className="pr-mono font-semibold text-[var(--pr-ink)] block">
                    {r.code}
                  </span>
                  <span className="text-[var(--pr-ink-2)]">{r.detail}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

