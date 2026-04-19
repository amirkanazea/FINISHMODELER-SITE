"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Shield, Zap, barChart as ChartBar, MousePointer2, HelpCircle, HardDrive } from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────
// שינוי הנתיב ל-assets כדי לעקוף את בעיית ה-ENOTDIR ב-Vercel
const IMAGES = [
  { src: "/assets/images/step1-hidden.jpg",   label: "STRUCTURE.VIEW",  mode: "WIREFRAME",  version: "v2.1.0" },
  { src: "/assets/images/step2-realistic.jpg", label: "MATERIAL.SCAN",   mode: "REALISTIC",  version: "v2.1.1" },
  { src: "/assets/images/step3-finish.jpg",    label: "FINISH.RENDER",   mode: "RENDERED",   version: "v2.1.2" },
];

const STEP_DURATION = 4800; 
const SCAN_DURATION = 3.2;  

const FEATURES = [
  { id: "01", title: "One-Click Automation",      body: "Generate precise architectural finishes instantly. Eliminate every repetitive modeling task in your Revit workflow.", icon: <Zap size={18} /> },
  { id: "02", title: "Instant BOQ Export",       body: "Extract accurate Bill of Quantities data the moment finishes are generated. Zero manual input, zero rework.", icon: <ChartBar size={18} /> },
  { id: "03", title: "Level & Room Filtering",   body: "Apply different finish types per level or room name. Bathrooms, living rooms, corridors — all handled separately.", icon: <MousePointer2 size={18} /> },
  { id: "04", title: "Smart Comments Auto-fill", body: "Every generated element is tagged with its Room Name automatically, making scheduling and filtering effortless.", icon: <Shield size={18} /> },
  { id: "05", title: "Built-in Help System",     body: "Instant walkthroughs via the ? icon on the Ribbon. Full visual documentation for every interface in the tool.", icon: <HelpCircle size={18} /> },
  { id: "06", title: "Hardware-Locked License",  body: "Single email · single workstation · instant key delivery. Secure, dedicated access from the moment you purchase.", icon: <HardDrive size={18} /> },
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

// ─── HUD Components ───────────────────────────────────────────────────────────
function HUDCoords({ active }: { active: number }) {
  const coords = [
    { x: "12.482", y: "8.114", z: "3.000", angle: "0.00°" },
    { x: "24.910", y: "16.003", z: "3.000", angle: "90.00°" },
    { x: "38.200", y: "22.750", z: "3.000", angle: "180.00°" },
  ];
  const c = coords[active] || coords[0];
  return (
    <motion.div
      key={active}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="hud-coords"
    >
      <span className="hud-row"><span className="hud-key">X</span><span className="hud-val">{c.x}</span></span>
      <span className="hud-row"><span className="hud-key">Y</span><span className="hud-val">{c.y}</span></span>
      <span className="hud-row"><span className="hud-key">Z</span><span className="hud-val">{c.z}</span></span>
      <span className="hud-row"><span className="hud-key">∠</span><span className="hud-val">{c.angle}</span></span>
    </motion.div>
  );
}

function ScannerPanel() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [scanning, setScanning] = useState(true);
  const [progress, setProgress] = useState(0);
  const progRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProgress(0);
    if (progRef.current) clearInterval(progRef.current);
    progRef.current = setInterval(() => {
      setProgress(p => (p >= 100 ? 100 : p + 1));
    }, STEP_DURATION / 100);
    return () => { if (progRef.current) clearInterval(progRef.current); };
  }, [active]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrev(active);
      setScanning(false);
      setTimeout(() => {
        setActive(a => (a + 1) % IMAGES.length);
        setScanning(true);
      }, 600);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, [active]);

  const img = IMAGES[active];

  return (
    <div className="scanner-root">
      <div className="corner tl" /><div className="corner tr" />
      <div className="corner bl" /><div className="corner br" />
      <div className="hud-bar top">
        <div className="hud-left"><span className="hud-dot pulse" /><span className="hud-label">{img.label}</span></div>
        <div className="hud-center"><span className="hud-mode">MODE · {img.mode}</span></div>
        <div className="hud-right"><span className="hud-ver">{img.version}</span></div>
      </div>
      <div className="scanner-viewport">
        {prev !== null && <motion.img key={`prev-${prev}`} src={IMAGES[prev].src} className="scanner-img" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.7 }} />}
        <AnimatePresence mode="wait">
          <motion.img key={`img-${active}`} src={img.src} className="scanner-img" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} />
        </AnimatePresence>
        {scanning && <motion.div key={`beam-${active}`} className="scan-beam" initial={{ top: "-2%" }} animate={{ top: "102%" }} transition={{ duration: SCAN_DURATION, ease: "linear" }} />}
        <div className="scan-grid" />
        <div className="hud-coords-wrap"><HUDCoords active={active} /></div>
        <div className="scan-progress-track"><motion.div className="scan-progress-fill" style={{ height: `${progress}%` }} /></div>
      </div>
      <div className="hud-bar bottom">
        <span className="hud-sys">SYS · ACTIVE</span>
        <div style={{ flex: 1 }} />
        <span className="hud-progress-lbl">{progress}%</span>
      </div>
    </div>
  );
}

function FeatureRow({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} className="feat-row" initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1 }}>
      <div className="feat-id">{f.id}</div>
      <div className="feat-divider" />
      <div>
        <div className="feat-title">{f.title}</div>
        <div className="feat-body">{f.body}</div>
      </div>
    </motion.div>
  );
}

function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const val = useCounter(end, 2000, inView);
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
    <div className="main-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono&display=swap');
        :root { --cyan: #00D4FF; --bg: #080A0D; --text: #E2E8F0; --muted: #4A5568; --mono: 'JetBrains Mono', monospace; --syne: 'Syne', sans-serif; }
        body { background: var(--bg); color: var(--text); font-family: var(--mono); margin: 0; overflow-x: hidden; }
        .nav { position: fixed; top: 0; width: 100%; height: 60px; background: rgba(8,10,13,0.8); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 100; display: flex; align-items: center; padding: 0 5%; justify-content: space-between; box-sizing: border-box; }
        .nav-logo { font-family: var(--syne); font-weight: 800; color: var(--text); text-decoration: none; font-size: 1.2rem; }
        .nav-logo span { color: var(--cyan); }
        .hero { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; align-items: center; padding: 0 5%; gap: 40px; }
        .hero-slogan { font-family: var(--syne); font-size: clamp(2rem, 5vw, 5rem); line-height: 1; margin: 0; }
        .cyan { color: var(--cyan); }
        .hero-subtitle { color: var(--muted); max-width: 400px; margin: 20px 0; }
        .scanner-root { background: #000; border: 1px solid rgba(0,212,255,0.2); position: relative; }
        .scanner-viewport { position: relative; aspect-ratio: 16/10; overflow: hidden; background: #111; }
        .scanner-img { position: absolute; width: 100%; height: 100%; object-fit: cover; }
        .scan-beam { position: absolute; width: 100%; height: 2px; background: var(--cyan); box-shadow: 0 0 15px var(--cyan); z-index: 10; }
        .scan-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px); background-size: 30px 30px; }
        .hud-bar { font-size: 10px; padding: 8px; display: flex; justify-content: space-between; background: rgba(0,212,255,0.05); color: var(--cyan); }
        .corner { position: absolute; width: 10px; height: 10px; border: 2px solid var(--cyan); z-index: 20; }
        .tl { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
        .tr { top: -2px; right: -2px; border-left: 0; border-bottom: 0; }
        .bl { bottom: -2px; left: -2px; border-right: 0; border-top: 0; }
        .br { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }
        .stats-section { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px
