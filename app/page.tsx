"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";

// ─── Config ───────────────────────────────────────────────────────────────────
const IMAGES = [
  { src: "/images/step1-hidden.jpg",   label: "STRUCTURE.VIEW",  mode: "WIREFRAME",  version: "v2.1.0" },
  { src: "/images/step2-realistic.jpg",label: "MATERIAL.SCAN",   mode: "REALISTIC",  version: "v2.1.1" },
  { src: "/images/step3-finish.jpg",   label: "FINISH.RENDER",   mode: "RENDERED",   version: "v2.1.2" },
];
const STEP_DURATION = 4800; // ms per image
const SCAN_DURATION = 3.2;  // seconds for beam

const FEATURES = [
  { id: "01", title: "One-Click Automation",   body: "Generate precise architectural finishes instantly. Eliminate every repetitive modeling task in your Revit workflow." },
  { id: "02", title: "Instant BOQ Export",      body: "Extract accurate Bill of Quantities data the moment finishes are generated. Zero manual input, zero rework." },
  { id: "03", title: "Level & Room Filtering",  body: "Apply different finish types per level or room name. Bathrooms, living rooms, corridors — all handled separately." },
  { id: "04", title: "Smart Comments Auto-fill",body: "Every generated element is tagged with its Room Name automatically, making scheduling and filtering effortless." },
  { id: "05", title: "Built-in Help System",    body: "Instant walkthroughs via the ? icon on the Ribbon. Full visual documentation for every interface in the tool." },
  { id: "06", title: "Hardware-Locked License", body: "Single email · single workstation · instant key delivery. Secure, dedicated access from the moment you purchase." },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useCounter(end: number, duration = 1600, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const p = Math.min((now - startTime) / duration, 1);
      setVal(Math.floor(p * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [start, end, duration]);
  return val;
}

// ─── HUD Coords component ─────────────────────────────────────────────────────
function HUDCoords({ active }: { active: number }) {
  const coords = [
    { x: "12.482", y: "8.114", z: "3.000", angle: "0.00°" },
    { x: "24.910", y: "16.003", z: "3.000", angle: "90.00°" },
    { x: "38.200", y: "22.750", z: "3.000", angle: "180.00°" },
  ];
  const c = coords[active];
  return (
    <motion.div
      key={active}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="hud-coords"
    >
      <span className="hud-row"><span className="hud-key">X</span><span className="hud-val">{c.x}</span></span>
      <span className="hud-row"><span className="hud-key">Y</span><span className="hud-val">{c.y}</span></span>
      <span className="hud-row"><span className="hud-key">Z</span><span className="hud-val">{c.z}</span></span>
      <span className="hud-row"><span className="hud-key">∠</span><span className="hud-val">{c.angle}</span></span>
    </motion.div>
  );
}

// ─── X-Ray Scanner Panel ──────────────────────────────────────────────────────
function ScannerPanel() {
  const [active, setActive]         = useState(0);
  const [prev, setPrev]             = useState<number | null>(null);
  const [scanning, setScanning]     = useState(true);
  const [progress, setProgress]     = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Progress bar
  useEffect(() => {
    setProgress(0);
    if (progRef.current) clearInterval(progRef.current);
    const tick = STEP_DURATION / 100;
    progRef.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(progRef.current!); return 100; } return p + 1; });
    }, tick);
    return () => { if (progRef.current) clearInterval(progRef.current); };
  }, [active]);

  // Auto-cycle
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPrev(active);
      setScanning(false);
      setTimeout(() => {
        setActive(a => (a + 1) % IMAGES.length);
        setScanning(true);
      }, 600);
    }, STEP_DURATION);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const img = IMAGES[active];

  return (
    <div className="scanner-root">
      {/* Corner brackets */}
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />

      {/* Top HUD bar */}
      <div className="hud-bar top">
        <div className="hud-left">
          <span className="hud-dot pulse" />
          <span className="hud-label">{img.label}</span>
        </div>
        <div className="hud-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={active}
              className="hud-mode"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
            >
              MODE · {img.mode}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="hud-right">
          <span className="hud-ver">{img.version}</span>
        </div>
      </div>

      {/* Image stack */}
      <div className="scanner-viewport">
        {/* Base layer — previous image fading */}
        {prev !== null && (
          <motion.img
            key={`prev-${prev}`}
            src={IMAGES[prev].src}
            alt=""
            className="scanner-img"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          />
        )}

        {/* Active image */}
        <AnimatePresence>
          <motion.img
            key={`img-${active}`}
            src={img.src}
            alt={img.label}
            className="scanner-img"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </AnimatePresence>

        {/* X-Ray scan beam */}
        {scanning && (
          <motion.div
            key={`beam-${active}`}
            className="scan-beam"
            initial={{ top: "-2%" }}
            animate={{ top: "102%" }}
            transition={{ duration: SCAN_DURATION, ease: "linear" }}
          />
        )}

        {/* Scan grid overlay */}
        <div className="scan-grid" />

        {/* Bottom-left HUD coords */}
        <div className="hud-coords-wrap">
          <AnimatePresence mode="wait">
            <HUDCoords key={active} active={active} />
          </AnimatePresence>
        </div>

        {/* Bottom-right: step indicator */}
        <div className="hud-steps">
          {IMAGES.map((_, i) => (
            <div
              key={i}
              className={`hud-step-pip${i === active ? " active" : ""}`}
            />
          ))}
        </div>

        {/* Right edge — scan progress */}
        <div className="scan-progress-track">
          <motion.div
            className="scan-progress-fill"
            style={{ height: `${progress}%` }}
          />
        </div>

        {/* Cross-hair center */}
        <div className="crosshair">
          <div className="ch-h" /><div className="ch-v" />
          <div className="ch-dot" />
        </div>
      </div>

      {/* Bottom HUD bar */}
      <div className="hud-bar bottom">
        <span className="hud-sys">SYS · ACTIVE</span>
        <span className="hud-spacer" />
        <span className="hud-progress-lbl">{progress}%</span>
        <span className="hud-seq">SEQ {String(active + 1).padStart(2,"0")} / {String(IMAGES.length).padStart(2,"0")}</span>
      </div>
    </div>
  );
}

// ─── Feature Row ──────────────────────────────────────────────────────────────
function FeatureRow({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className="feat-row"
      initial={{ opacity: 0, x: -24 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.55, delay: i * 0.07 }}
    >
      <div className="feat-id">{f.id}</div>
      <div className="feat-divider" />
      <div>
        <div className="feat-title">{f.title}</div>
        <div className="feat-body">{f.body}</div>
      </div>
    </motion.div>
  );
}

// ─── Stat Counter ─────────────────────────────────────────────────────────────
function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const val = useCounter(end, 1400, inView);
  return (
    <div ref={ref} className="stat-block">
      <div className="stat-num">{val}<span className="stat-suffix">{suffix}</span></div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cyan:        #00D4FF;
          --cyan-dim:    rgba(0,212,255,0.12);
          --cyan-border: rgba(0,212,255,0.28);
          --cyan-glow:   rgba(0,212,255,0.06);
          --bg:          #080A0D;
          --bg2:         #0C0F13;
          --bg3:         #111419;
          --text:        #E2E8F0;
          --muted:       #4A5568;
          --muted2:      #2D3748;
          --border:      rgba(255,255,255,0.07);
          --syne:        'Syne', system-ui, sans-serif;
          --mono:        'JetBrains Mono', monospace;
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--mono);
          font-size: 13px;
          line-height: 1.65;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ─── Nav ─────────────────────────────────────────────────────── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          backdrop-filter: blur(18px) saturate(1.6);
          -webkit-backdrop-filter: blur(18px) saturate(1.6);
          background: rgba(8,10,13,0.62);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center;
          height: 52px; padding: 0 28px; gap: 32px;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-mark {
          width: 28px; height: 28px; border-radius: 4px;
          background: var(--cyan); display: flex; align-items: center;
          justify-content: center; font-weight: 700; font-size: 12px;
          color: #080A0D; font-family: var(--mono); letter-spacing: -0.03em;
        }
        .nav-wordmark {
          font-family: var(--syne); font-size: 15px; font-weight: 700;
          color: var(--text); letter-spacing: 0.01em;
        }
        .nav-wordmark span { color: var(--cyan); }
        .nav-links {
          display: flex; list-style: none; gap: 0; flex: 1;
        }
        .nav-links li {
          padding: 0 16px; font-size: 11px; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--muted); cursor: pointer;
          transition: color 0.2s;
        }
        .nav-links li:hover { color: var(--text); }
        .nav-cta {
          position: relative; display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--cyan);
          background: var(--cyan-dim); border: 1px solid var(--cyan-border);
          padding: 8px 18px; border-radius: 3px; cursor: pointer;
          text-decoration: none; overflow: hidden; white-space: nowrap;
          transition: background 0.2s;
        }
        .nav-cta::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(0,212,255,0.18) 50%, transparent 70%);
          animation: shimmer 2.8s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .nav-cta-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--cyan); animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        /* ─── Hero ────────────────────────────────────────────────────── */
        .hero {
          min-height: 100vh; display: grid;
          grid-template-columns: 1fr 1.15fr;
          align-items: center; gap: 0;
          padding: 52px 0 0; max-width: 100%;
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 60% at 70% 50%, rgba(0,212,255,0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-left {
          padding: 60px 48px 60px 10vw;
          display: flex; flex-direction: column; gap: 0;
          position: relative; z-index: 2;
        }
        .hero-eyebrow {
          font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--cyan); margin-bottom: 22px;
          display: flex; align-items: center; gap: 12px;
        }
        .hero-eyebrow::before {
          content: ''; display: inline-block; width: 28px; height: 1px;
          background: var(--cyan);
        }
        .hero-slogan {
          font-family: var(--syne); font-weight: 800;
          font-size: clamp(44px, 5.5vw, 86px);
          line-height: 0.95; letter-spacing: -0.02em;
          color: var(--text); margin-bottom: 8px;
        }
        .hero-slogan .cyan { color: var(--cyan); }
        .hero-slogan .thin { font-weight: 400; opacity: 0.5; display: block; font-size: 0.55em; letter-spacing: 0.05em; margin-top: 6px; }
        .hero-subtitle {
          font-size: 13px; color: var(--muted); line-height: 1.8;
          max-width: 380px; margin: 28px 0 40px; font-weight: 300;
        }
        .hero-meta {
          display: flex; flex-direction: column; gap: 10px;
        }
        .hero-meta-row {
          display: flex; align-items: center; gap: 10px;
          font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
        }
        .hmr-key { color: var(--muted); min-width: 80px; }
        .hmr-bar {
          flex: 1; height: 1px; background: var(--muted2);
          position: relative; max-width: 140px;
        }
        .hmr-bar-fill {
          position: absolute; top: 0; left: 0; height: 100%;
          background: var(--cyan);
        }
        .hmr-val { color: var(--text); }

        /* ─── Scanner ──────────────────────────────────────────────────── */
        .hero-right {
          height: 100vh; position: relative;
          display: flex; align-items: center; justify-content: center;
          padding: 72px 5vw 40px 24px;
        }
        .scanner-root {
          position: relative; width: 100%; max-width: 640px;
          background: #050709; border: 1px solid rgba(0,212,255,0.15);
          border-radius: 3px; overflow: visible;
          box-shadow: 0 0 0 1px rgba(0,212,255,0.04),
                      0 32px 80px rgba(0,0,0,0.7),
                      inset 0 0 60px rgba(0,212,255,0.02);
        }
        /* Corners */
        .corner {
          position: absolute; width: 14px; height: 14px;
          border-color: var(--cyan); border-style: solid; z-index: 10;
        }
        .corner.tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .corner.tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
        .corner.bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
        .corner.br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        /* HUD bars */
        .hud-bar {
          display: flex; align-items: center; gap: 12px;
          padding: 7px 14px; background: rgba(0,212,255,0.04);
          border-color: rgba(0,212,255,0.12); border-style: solid;
          font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
        }
        .hud-bar.top { border-width: 0 0 1px 0; }
        .hud-bar.bottom { border-width: 1px 0 0 0; }
        .hud-left { display: flex; align-items: center; gap: 8px; }
        .hud-center { flex: 1; text-align: center; }
        .hud-right { text-align: right; }
        .hud-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cyan); }
        .hud-dot.pulse { animation: pulse 1.8s ease-in-out infinite; }
        .hud-label { color: var(--cyan); font-weight: 500; }
        .hud-mode { color: var(--muted); letter-spacing: 0.16em; }
        .hud-ver { color: var(--muted); }
        .hud-sys { color: var(--cyan); }
        .hud-spacer { flex: 1; }
        .hud-progress-lbl { color: var(--text); font-weight: 500; min-width: 32px; text-align: right; }
        .hud-seq { color: var(--muted); }

        /* Viewport */
        .scanner-viewport {
          position: relative; aspect-ratio: 16/10; overflow: hidden;
        }
        .scanner-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; display: block;
        }

        /* Scan beam */
        .scan-beam {
          position: absolute; left: 0; right: 0; height: 3px; z-index: 20; pointer-events: none;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0,212,255,0.06) 20%,
            rgba(0,212,255,0.55) 50%,
            rgba(0,212,255,0.06) 80%,
            transparent 100%
          );
          filter: blur(1px);
          box-shadow: 0 0 16px 6px rgba(0,212,255,0.28);
        }

        /* Grid overlay */
        .scan-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 5;
          background-image:
            linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Crosshair */
        .crosshair {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%); z-index: 15; pointer-events: none;
        }
        .ch-h { position: absolute; top: 0; left: -20px; width: 40px; height: 1px; background: rgba(0,212,255,0.35); }
        .ch-v { position: absolute; top: -20px; left: 0; width: 1px; height: 40px; background: rgba(0,212,255,0.35); }
        .ch-dot { position: absolute; top: -2px; left: -2px; width: 4px; height: 4px; border-radius: 50%; background: var(--cyan); }

        /* HUD coords (bottom-left) */
        .hud-coords-wrap {
          position: absolute; bottom: 10px; left: 12px; z-index: 20;
        }
        .hud-coords {
          display: flex; flex-direction: column; gap: 2px;
          background: rgba(8,10,13,0.8); padding: 6px 10px;
          border: 1px solid rgba(0,212,255,0.15); border-radius: 1px;
          backdrop-filter: blur(4px);
        }
        .hud-row { display: flex; gap: 8px; font-size: 9px; letter-spacing: 0.08em; }
        .hud-key { color: var(--cyan); min-width: 10px; }
        .hud-val { color: var(--text); font-family: var(--mono); }

        /* Step pips */
        .hud-steps {
          position: absolute; bottom: 12px; right: 20px; z-index: 20;
          display: flex; gap: 5px; align-items: center;
        }
        .hud-step-pip {
          width: 20px; height: 2px; background: var(--muted2);
          border-radius: 1px; transition: background 0.4s, width 0.3s;
        }
        .hud-step-pip.active { background: var(--cyan); width: 32px; }

        /* Side progress */
        .scan-progress-track {
          position: absolute; right: 0; top: 0; bottom: 0;
          width: 3px; background: var(--muted2); z-index: 20;
        }
        .scan-progress-fill {
          width: 100%; background: var(--cyan);
          transition: height 0.1s linear;
          box-shadow: 0 0 6px rgba(0,212,255,0.5);
        }

        /* ─── Stats ────────────────────────────────────────────────────── */
        .stats-section {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--bg2);
        }
        .stats-inner {
          max-width: 1280px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4,1fr);
        }
        .stat-block {
          padding: 44px 32px; border-right: 1px solid var(--border);
          text-align: center;
        }
        .stat-block:last-child { border-right: none; }
        .stat-num {
          font-family: var(--syne); font-size: 48px; font-weight: 800;
          color: var(--text); line-height: 1; letter-spacing: -0.03em;
        }
        .stat-suffix { font-size: 28px; color: var(--cyan); }
        .stat-label { font-size: 10px; color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase; margin-top: 10px; }

        /* ─── Features ────────────────────────────────────────────────── */
        .features-section { max-width: 1280px; margin: 0 auto; padding: 96px 10vw; }
        .features-header { margin-bottom: 60px; }
        .sec-eye {
          font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase;
          color: var(--cyan); margin-bottom: 12px;
          display: flex; align-items: center; gap: 12px;
        }
        .sec-eye::before { content:''; display:inline-block; width:24px; height:1px; background:var(--cyan); }
        .sec-title {
          font-family: var(--syne); font-size: clamp(26px, 3.5vw, 46px);
          font-weight: 700; color: var(--text); letter-spacing: -0.02em; line-height: 1.1;
        }
        .feat-grid { display: flex; flex-direction: column; gap: 0; }
        .feat-row {
          display: flex; align-items: flex-start; gap: 28px;
          padding: 28px 0; border-bottom: 1px solid var(--border);
        }
        .feat-row:first-child { border-top: 1px solid var(--border); }
        .feat-id { font-size: 11px; color: var(--cyan); font-weight: 500; min-width: 28px; padding-top: 2px; }
        .feat-divider { width: 1px; background: var(--muted2); align-self: stretch; flex-shrink: 0; }
        .feat-title { font-family: var(--syne); font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 6px; letter-spacing: -0.01em; }
        .feat-body { font-size: 12px; color: var(--muted); line-height: 1.75; font-weight: 300; max-width: 680px; }

        /* ─── Pricing ──────────────────────────────────────────────────── */
        .pricing-section {
          background: var(--bg2); border-top: 1px solid var(--border);
          padding: 96px 10vw;
        }
        .pricing-inner { max-width: 1280px; margin: 0 auto; }
        .pricing-grid {
          display: grid; grid-template-columns: repeat(2,1fr);
          gap: 1px; background: var(--border);
          border: 1px solid var(--border); border-radius: 3px;
          overflow: hidden; max-width: 700px; margin: 48px auto 0;
        }
        .plan-card {
          background: var(--bg3); padding: 40px 36px; position: relative;
          transition: background 0.2s;
        }
        .plan-card.featured { background: var(--bg); }
        .plan-badge {
          position: absolute; top: 16px; right: 16px;
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--cyan); background: var(--cyan-dim);
          border: 1px solid var(--cyan-border); padding: 3px 10px; border-radius: 2px;
        }
        .plan-label {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 20px;
        }
        .plan-price {
          font-family: var(--syne); font-size: 48px; font-weight: 800;
          color: var(--text); line-height: 1; letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .plan-per { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
        .plan-save { font-size: 10px; color: var(--cyan); letter-spacing: 0.08em; margin-bottom: 32px; }
        .plan-list { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
        .plan-list li { font-size: 12px; color: var(--muted); display: flex; gap: 10px; align-items: flex-start; }
        .plan-list li::before { content: '→'; color: var(--cyan); flex-shrink: 0; }
        .plan-btn {
          display: block; width: 100%; padding: 13px;
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer;
          border-radius: 2px; transition: background 0.2s, border-color 0.2s;
          border: 1px solid var(--muted2); background: transparent; color: var(--muted);
        }
        .plan-btn.featured {
          background: var(--cyan); border-color: var(--cyan);
          color: #080A0D; font-weight: 600;
        }
        .plan-btn.featured:hover { background: #00EEFF; }
        .plan-note { font-size: 10px; color: var(--muted2); margin-top: 12px; text-align: center; letter-spacing: 0.06em; }

        /* License rows */
        .license-rows { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 700px; margin: 40px auto 0; }
        .lic-item { display: flex; gap: 14px; align-items: flex-start; }
        .lic-icon {
          width: 32px; height: 32px; flex-shrink: 0;
          border: 1px solid var(--cyan-border); background: var(--cyan-dim);
          border-radius: 2px; display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: var(--cyan);
        }
        .lic-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
        .lic-desc { font-size: 11px; color: var(--muted); line-height: 1.65; }

        /* ─── Footer ───────────────────────────────────────────────────── */
        .footer {
          border-top: 1px solid var(--border); padding: 24px 10vw;
          background: var(--bg);
        }
        .footer-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 10px; color: var(--muted); letter-spacing: 0.1em;
          flex-wrap: wrap; gap: 10px;
        }
        .footer-link { color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: var(--cyan); }

        /* ─── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; min-height: auto; }
          .hero-left { padding: 80px 24px 32px; }
          .hero-right { height: 60vw; min-height: 320px; padding: 0 24px 32px; }
          .stats-inner { grid-template-columns: repeat(2,1fr); }
          .stat-block:nth-child(2) { border-right: none; }
          .pricing-grid { grid-template-columns: 1fr; max-width: 380px; }
          .license-rows { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .features-section { padding: 64px 24px; }
          .pricing-section { padding: 64px 24px; }
          .footer { padding: 20px 24px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <motion.nav
        className="nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <div className="nav-mark">FM</div>
            <div className="nav-wordmark">Finish<span>Modeler</span></div>
          </a>
          <ul className="nav-links">
            <li>Features</li>
            <li>Pricing</li>
            <li>Support</li>
          </ul>
          <div style={{ flex: 1 }} />
          <a
            href="https://apps.autodesk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta"
          >
            <div className="nav-cta-dot" />
            Autodesk App Store
          </a>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="hero">
        {/* Left — text */}
        <div className="hero-left">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div className="hero-eyebrow">Revit Add-in · BIM Automation</div>
            <h1 className="hero-slogan">
              BEYOND<br />
              THE<br />
              <span className="cyan">ORDINARY</span>
              <span className="thin">FINISHMODELER</span>
            </h1>
            <p className="hero-subtitle">
              Automate Your Revit Workflow. Save Hours of Manual Work.
              A professional add-in developed by Engineers to eliminate
              repetitive tasks and deliver instant, high-quality results.
            </p>
          </motion.div>

          <motion.div
            className="hero-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            {[
              { key: "PRECISION",   val: "± 0.1mm",  fill: "100%" },
              { key: "AUTOMATION",  val: "1-Click",   fill: "100%" },
              { key: "BOQ EXPORT",  val: "Instant",   fill: "100%" },
            ].map((r) => (
              <div key={r.key} className="hero-meta-row">
                <span className="hmr-key">{r.key}</span>
                <div className="hmr-bar">
                  <motion.div
                    className="hmr-bar-fill"
                    initial={{ width: "0%" }}
                    animate={{ width: r.fill }}
                    transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="hmr-val">{r.val}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — Scanner */}
        <motion.div
          className="hero-right"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          <ScannerPanel />
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-inner">
          <StatCounter end={1}  suffix="×"  label="Click to Full Finish" />
          <StatCounter end={100} suffix="%" label="BOQ Accuracy" />
          <StatCounter end={500} suffix="+" label="Projects Delivered" />
          <StatCounter end={60}  suffix="%" label="Time Saved" />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features">
        <div className="features-section">
          <div className="features-header">
            <div className="sec-eye">Key Features</div>
            <h2 className="sec-title">
              Everything Built<br />For Revit Professionals.
            </h2>
          </div>
          <div className="feat-grid">
            {FEATURES.map((f, i) => <FeatureRow key={f.id} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-inner">
          <div className="sec-eye">Subscription Plans</div>
          <h2 className="sec-title">
            Straightforward Pricing.<br />No Surprises.
          </h2>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, maxWidth: 540, lineHeight: 1.8 }}>
            All plans include full technical support, software updates, and instant license key delivery.
            Subscriptions can be canceled at any time — no refunds for already billed periods.
          </p>

          <div className="pricing-grid">
            {/* Monthly */}
            <div className="plan-card">
              <div className="plan-label">Monthly</div>
              <div className="plan-price">$39<span style={{ fontSize: 24, fontWeight: 400 }}>.99</span></div>
              <div className="plan-per">per month</div>
              <div className="plan-save">&nbsp;</div>
              <ul className="plan-list">
                {["Full access to all features","All software updates","Technical support","Instant license key delivery","Cancel anytime"].map(i => <li key={i}>{i}</li>)}
              </ul>
              <button className="plan-btn">Get Started</button>
              <p className="plan-note">Billed monthly</p>
            </div>
            {/* Annual */}
            <div className="plan-card featured">
              <div className="plan-badge">Best Value</div>
              <div className="plan-label">Annual</div>
              <div className="plan-price">$419<span style={{ fontSize: 24, fontWeight: 400 }}>.99</span></div>
              <div className="plan-per">per year</div>
              <div className="plan-save">→ Save ~$60 vs monthly</div>
              <ul className="plan-list">
                {["Full access to all features","All software updates","Technical support","Instant license key delivery","Cancel anytime"].map(i => <li key={i}>{i}</li>)}
              </ul>
              <button className="plan-btn featured">Get Started</button>
              <p className="plan-note">Billed annually</p>
            </div>
          </div>

          <div className="license-rows">
            {[
              { icon: "⬒", title: "Single User · Single Workstation", desc: "Each license is tied to one email address and hardware-locked to one workstation for secure, dedicated access." },
              { icon: "⚡", title: "Instant Key Delivery", desc: "Receive your license key immediately after purchase and activate it directly in Revit — no waiting." },
            ].map(l => (
              <div key={l.title} className="lic-item">
                <div className="lic-icon">{l.icon}</div>
                <div>
                  <div className="lic-title">{l.title}</div>
                  <div className="lic-desc">{l.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <span>© {new Date().getFullYear()} FinishModeler · BIM Solutions</span>
          <a href="mailto:a.kbimsolutions@gmail.com" className="footer-link">
            a.kbimsolutions@gmail.com
          </a>
          <span>All plans include support & updates</span>
        </div>
      </footer>
    </>
  );
}
