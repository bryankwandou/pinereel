'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  Cpu,
  HardDrive,
  Layers,
  Play,
  ShieldCheck,
  ShieldOff,
  Sparkles,
} from 'lucide-react';
import { Magnetic, useSafeReducedMotion } from './MotionKit';

const DIAL_PRESETS = [
  {
    level: 25,
    tag: 'Layer 01 · Query Sanitizer',
    title: 'Strip Tracking Parameters Only',
    desc: 'Removes utm_*, fbclid, gclid, igsh, and si parameters while passing 100% of video and web links straight through.',
    activeModules: 2,
    latencyMs: '0.4 ms',
  },
  {
    level: 55,
    tag: 'Layer 02 · Wrapper Unwrapper',
    title: 'Bypass Ad Redirects & Recover Clean Video',
    desc: 'Unwraps doubleclick.net, googleadservices, l.instagram.com, and 5-hop shorteners to extract and play the real destination video.',
    activeModules: 4,
    latencyMs: '1.8 ms',
  },
  {
    level: 85,
    tag: 'Layer 03 · Strict Ad-Only Shield',
    title: 'Block Ads & Malware APK · Allow All Websites',
    desc: 'Blocks ad servers, popup scripts, and .apk/.exe malware binaries while allowing YouTube, X, IG, TikTok, and general web apps inside an ad-free sandbox.',
    activeModules: 5,
    latencyMs: '2.4 ms',
  },
  {
    level: 100,
    tag: 'Layer 05 · Zero-Signal Mountain Vault',
    title: 'Full Ad Shield + IndexedDB Offline Cache + Solana Proof',
    desc: 'Streams clean media into local IndexedDB storage with SHA-256 verification for 0-bar mountain trips and optional Solana Devnet Memo receipts.',
    activeModules: 6,
    latencyMs: '0.0 ms offline',
  },
];

const LIVE_PACKETS = [
  { host: 'youtube.com/watch?v=aqz-KE-bpKQ', kind: 'video', action: 'PLAY STREAM' },
  { host: 'ads.doubleclick.net/pagead/adview', kind: 'ad', action: 'AD BLOCKED' },
  { host: 'sonacast-ten.vercel.app/favorites', kind: 'web', action: 'SANDBOX PLAY' },
  { host: 'popads.net/popunder.js', kind: 'ad', action: 'POPUP KILLED' },
  { host: 'x.com/OpenAI/status/1758192957386342435', kind: 'video', action: 'MP4 EXTRACTED' },
  { host: 'instagram.com/p/CmUv48DLvxd', kind: 'video', action: 'CLEAN EMBED' },
  { host: 'adsterra.com/slot-bonus.apk', kind: 'ad', action: 'APK BLOCKED' },
  { host: 'tiktok.com/@scout2015/video/67183', kind: 'video', action: 'NO-WATERMARK' },
];

const QUICK_LAUNCH_SOURCES = [
  {
    label: 'YouTube 4K MP4',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ&utm_source=ad&fbclid=track',
  },
  {
    label: 'Instagram Reel MP4',
    url: 'https://www.instagram.com/reel/Df7ICLZNPyp/',
  },
  {
    label: 'X Video MP4',
    url: 'https://x.com/OpenAI/status/1758192957386342435',
  },
  {
    label: 'TED External MP4',
    url: 'https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity',
  },
  {
    label: 'TikTok Clean MP4',
    url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
  },
];

export function InteractiveMotionDeck({
  onSelectUrl,
}: {
  onSelectUrl?: (url: string) => void;
}) {
  const reduce = useSafeReducedMotion();
  const [dial, setDial] = useState(85);
  const [packetTick, setPacketTick] = useState(0);
  const [tilt, setTilt] = useState({ x: -8, y: 12 });

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      setPacketTick((p) => (p + 1) % LIVE_PACKETS.length);
    }, 1650);
    return () => clearInterval(t);
  }, [reduce]);

  const currentPreset =
    DIAL_PRESETS.reduce((prev, curr) =>
      Math.abs(curr.level - dial) < Math.abs(prev.level - dial) ? curr : prev
    ) ?? DIAL_PRESETS[2];

  const visiblePackets = [
    LIVE_PACKETS[packetTick % LIVE_PACKETS.length],
    LIVE_PACKETS[(packetTick + 1) % LIVE_PACKETS.length],
    LIVE_PACKETS[(packetTick + 2) % LIVE_PACKETS.length],
    LIVE_PACKETS[(packetTick + 3) % LIVE_PACKETS.length],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-t border-[var(--pr-rule)] pt-10">
        <div className="space-y-2 max-w-2xl">
          <span className="pr-kicker">
            <Sparkles size={13} className="text-[var(--pr-signal)]" aria-hidden="true" />
            INTERACTIVE AD-SHIELD &amp; 3D CHOREOGRAPHY STUDIO
          </span>
          <h2 className="pr-h2">
            One dial from raw URL to zero-signal vault. Blocks ads only — never your video or web links.
          </h2>
        </div>
        <p className="text-xs pr-mono text-[var(--pr-ink-3)] m-0">
          6 LIVE MOTION ENGINES · CLICK ANY SOURCE TO TEST IN WORKBENCH
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Giant 0-100 Interactive Dial Card */}
        <div className="lg:col-span-5 pr-card p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="pr-badge pr-badge--good">{currentPreset.tag}</span>
              <span className="pr-mono text-xs text-[var(--pr-ink-3)]">
                {currentPreset.latencyMs}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <motion.span
                key={dial}
                initial={reduce ? false : { scale: 0.94, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="pr-mono font-semibold leading-none text-[var(--pr-ink)]"
                style={{ fontSize: 'clamp(3.5rem, 6vw, 5.25rem)', letterSpacing: '-0.04em' }}
              >
                {dial}
              </motion.span>
              <span className="pr-mono text-sm text-[var(--pr-signal)] font-semibold">
                / 100 SHIELD LEVEL
              </span>
            </div>

            <h3 className="pr-h3 text-lg">{currentPreset.title}</h3>
            <p className="text-sm text-[var(--pr-ink-2)] m-0">{currentPreset.desc}</p>
          </div>

          <div className="space-y-4">
            <div className="pr-sunken p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs pr-mono">
                <label htmlFor="shield-intensity-dial" className="font-semibold text-[var(--pr-ink)]">
                  SCRUB PROTECTION DEPTH
                </label>
                <span className="text-[var(--pr-signal)] font-semibold">
                  {currentPreset.activeModules} / 6 GATES ACTIVE
                </span>
              </div>
              <input
                id="shield-intensity-dial"
                type="range"
                min={10}
                max={100}
                value={dial}
                onChange={(e) => setDial(Number(e.target.value))}
                className="w-full accent-[var(--pr-signal)] cursor-pointer"
              />
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {DIAL_PRESETS.map((p) => {
                  const active = Math.abs(p.level - dial) < 12;
                  return (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => setDial(p.level)}
                      className="px-2 py-1.5 rounded-[var(--pr-r-sm)] text-xs pr-mono font-semibold border cursor-pointer transition-colors"
                      style={{
                        background: active ? 'var(--pr-signal)' : 'var(--pr-raised)',
                        color: active ? 'var(--pr-signal-ink)' : 'var(--pr-ink-2)',
                        borderColor: active ? 'var(--pr-signal)' : 'var(--pr-rule)',
                      }}
                    >
                      L{p.level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Magnetic Quick-Test Source Dock */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--pr-ink-2)] block">
                Instant Test in Player (Magnetic Launchers):
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_LAUNCH_SOURCES.map((src) => (
                  <Magnetic key={src.label} strength={0.28}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectUrl?.(src.url);
                        document.getElementById('workbench')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="pr-btn pr-btn--secondary pr-btn--sm"
                    >
                      <Play size={12} className="text-[var(--pr-signal)]" aria-hidden="true" />
                      <span>{src.label}</span>
                    </button>
                  </Magnetic>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dark High-Contrast 6-Widget Live Choreography Stage */}
        <div
          data-allow-dark="true"
          className="lg:col-span-7 pr-stage-dark p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Card 1: Live Ad-Only Filter Stream */}
          <div className="p-4 rounded-[var(--pr-r-lg)] border border-[#243830] bg-[#101c18] space-y-3">
            <div className="flex items-center justify-between">
              <span className="pr-mono text-[11px] text-[#5fe09e] font-semibold flex items-center gap-1.5">
                <ShieldCheck size={13} aria-hidden="true" />
                01 · AD-ONLY STREAM FILTER
              </span>
              <span className="pr-mono text-[10px] text-[#929e98]">LIVE CONVEYOR</span>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {visiblePackets.map((pkt) => {
                  const isAd = pkt.kind === 'ad';
                  return (
                    <motion.div
                      key={pkt.host}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.25 }}
                      className="px-2.5 py-1.5 rounded-[var(--pr-r-sm)] border flex items-center justify-between gap-2 text-xs pr-mono"
                      style={{
                        background: isAd ? '#281312' : '#11281f',
                        borderColor: isAd ? '#6b2624' : '#245b43',
                        color: isAd ? '#f88a84' : '#f2f1ec',
                      }}
                    >
                      <span className={`truncate ${isAd ? 'line-through' : ''}`}>{pkt.host}</span>
                      <span
                        className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          background: isAd ? '#3b1716' : '#163b2c',
                          color: isAd ? '#f88a84' : '#5fe09e',
                        }}
                      >
                        {pkt.action}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Card 2: Interactive 3D Perspective Layer Stack */}
          <div
            className="p-4 rounded-[var(--pr-r-lg)] border border-[#243830] bg-[#101c18] space-y-3 flex flex-col justify-between"
            onPointerMove={(e) => {
              if (reduce || e.pointerType !== 'mouse') return;
              const r = e.currentTarget.getBoundingClientRect();
              const nx = (e.clientX - r.left) / r.width - 0.5;
              const ny = (e.clientY - r.top) / r.height - 0.5;
              setTilt({ x: -ny * 18, y: nx * 22 });
            }}
            onPointerLeave={() => setTilt({ x: -8, y: 12 })}
          >
            <div className="flex items-center justify-between">
              <span className="pr-mono text-[11px] text-[#5fe09e] font-semibold flex items-center gap-1.5">
                <Layers size={13} aria-hidden="true" />
                02 · 3D SANDBOX STACK
              </span>
              <span className="pr-mono text-[10px] text-[#929e98]">HOVER 3D TILT</span>
            </div>

            <div className="py-2 flex items-center justify-center" style={{ perspective: '700px' }}>
              <motion.div
                animate={{
                  rotateX: reduce ? 0 : tilt.x,
                  rotateY: reduce ? 0 : tilt.y,
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full space-y-2"
              >
                <div
                  style={{ transform: 'translateZ(26px)' }}
                  className="p-2.5 rounded border border-[#245b43] bg-[#132d22] text-[11px] pr-mono text-[#5fe09e] flex items-center justify-between"
                >
                  <span>L3: Clean Video &amp; Web Player</span>
                  <CheckCircle2 size={13} aria-hidden="true" />
                </div>
                <div
                  style={{ transform: 'translateZ(14px)' }}
                  className="p-2.5 rounded border border-[#5e4214] bg-[#261c0b] text-[11px] pr-mono text-[#f5b952] flex items-center justify-between"
                >
                  <span>L2: Ad-Wrapper &amp; Popup Strip</span>
                  <span>-{Math.round(dial * 0.14)} trackers</span>
                </div>
                <div
                  style={{ transform: 'translateZ(4px)' }}
                  className="p-2.5 rounded border border-[#6b2624] bg-[#281312] text-[11px] pr-mono text-[#f88a84] flex items-center justify-between"
                >
                  <span className="line-through">L1: DoubleClick / APK Trap</span>
                  <ShieldOff size={13} aria-hidden="true" />
                </div>
              </motion.div>
            </div>

            <p className="text-[11px] text-[#c5ccc8] pr-mono m-0">
              Popups blocked via iframe sandbox · Videos unblocked
            </p>
          </div>

          {/* Card 3: 60 FPS Audio/Video Equalizer & Bitrate Wave */}
          <div className="p-4 rounded-[var(--pr-r-lg)] border border-[#243830] bg-[#101c18] space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="pr-mono text-[11px] text-[#5fe09e] font-semibold flex items-center gap-1.5">
                <Activity size={13} aria-hidden="true" />
                03 · STREAM TELEMETRY WAVE
              </span>
              <span className="pr-mono text-[10px] text-[#f2f1ec]">
                {(dial * 0.12 + 2.4).toFixed(1)} Mbps
              </span>
            </div>

            <div className="h-16 flex items-end gap-[3px] pt-2" aria-hidden="true">
              {Array.from({ length: 40 }).map((_, idx) => {
                const h = 14 + Math.round(((Math.sin(idx * 0.48 + packetTick * 0.9) + 1) * 0.5) * (dial * 0.46));
                return (
                  <motion.span
                    key={idx}
                    animate={{ height: `${Math.min(60, Math.max(8, h))}px` }}
                    transition={reduce ? { duration: 0.01 } : { duration: 0.42, ease: 'easeInOut' }}
                    className="flex-1 rounded-t-sm"
                    style={{
                      background: idx % 3 === 0 ? '#5fe09e' : '#33c288',
                    }}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] pr-mono text-[#c5ccc8]">
              <span>HLS / MP4 / Web Audio</span>
              <span className="text-[#5fe09e]">0 AD INTERRUPTIONS</span>
            </div>
          </div>

          {/* Card 4: Offline Mountain Vault SHA-256 & Solana Devnet Proof */}
          <div className="p-4 rounded-[var(--pr-r-lg)] border border-[#243830] bg-[#101c18] space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="pr-mono text-[11px] text-[#5fe09e] font-semibold flex items-center gap-1.5">
                <HardDrive size={13} aria-hidden="true" />
                04 · VAULT SHA-256 &amp; SOLANA
              </span>
              <span className="pr-mono text-[10px] text-[#f5b952]">DEVNET MEMO</span>
            </div>

            <div className="p-2.5 rounded bg-[#0b1310] border border-[#243830] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] pr-mono text-[#929e98]">
                <span>CHUNK INTEGRITY</span>
                <span className="text-[#5fe09e]">VERIFIED</span>
              </div>
              <code className="block text-[11px] pr-mono text-[#f2f1ec] truncate">
                sha256:{((packetTick + 1) * 982451653).toString(16)}c3424ca332a91047e908
              </code>
            </div>

            <div className="flex items-center justify-between text-[11px] pr-mono text-[#c5ccc8]">
              <span className="inline-flex items-center gap-1.5">
                <Cpu size={12} className="text-[#5fe09e]" aria-hidden="true" />
                IndexedDB Blob Ready
              </span>
              <span className="text-[#5fe09e]">0.0 ms Mountain Seek</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

