"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

// =============================================================
// TYPES
// =============================================================

type Case = {
  id: string;
  diagnosis: string;
  aliases: string[];
  clues: string[];
  teachingPoints: string[];
  difficulty?: string;
  system?: string;
};

type Guess = {
  text: string;
  correct: boolean;
  skipped: boolean;
};

// =============================================================
// CONFIG
// =============================================================

const MAX_GUESSES = 6;

// =============================================================
// DAILY CASE SYSTEM
// June 4 2026 = Case 61. Each day after = next case in sequence.
// Cases 1-50:  hidden endless pool (fallback if random file empty)
// Cases 51-60: archive (past 10 daily cases)
// Cases 61+:   daily cases, one per day
// =============================================================

const DAILY_ANCHOR_DATE = new Date("2026-06-04T00:00:00");
const DAILY_ANCHOR_CASE_ID = 61;
const ARCHIVE_START = 51;
const RANDOM_POOL_MAX = 50;

// Random/endless cases live in this separate file
const RANDOM_CASES_FILE = "/crimindle cases/crimindle_random_cases.txt";

// =============================================================
// THEME TOKENS
// =============================================================

const DARK_THEME = {
  bg:             "#050505",
  bgCard:         "#1a1000",
  bgInput:        "#1a1000",
  bgMonitor:      "#0a0500",
  border:         "#3a2a0a",
  borderAccent:   "#d4af37",
  text:           "#e8d5a0",
  textMuted:      "#c9a227",
  textFaint:      "#8a7340",
  accent:         "#d4af37",
  clueNum:        "#8a7340",
  logoPanel:      "#1a1000",
  logoBorder:     "#3a2a0a",
  selectBg:       "#1a1000",
  modalWin:       "#100a00",
  modalLose:      "#120000",
  modalBorderWin: "#d4af37",
  modalBorderLose:"#7b241c",
  shareCard:      "#100800",
  teachPanel:     "#0a0500",
  filterPanel:    "#1a1000",
};

const LIGHT_THEME = {
  bg:             "#fffdf5",
  bgCard:         "#ffffff",
  bgInput:        "#ffffff",
  bgMonitor:      "#fffbeb",
  border:         "#fde68a",
  borderAccent:   "#b45309",
  text:           "#1c1400",
  textMuted:      "#92400e",
  textFaint:      "#a16207",
  accent:         "#b45309",
  clueNum:        "#b45309",
  logoPanel:      "#1c1400",
  logoBorder:     "#3a2a0a",
  selectBg:       "#ffffff",
  modalWin:       "#fffbeb",
  modalLose:      "#fff1f2",
  modalBorderWin: "#d4af37",
  modalBorderLose:"#f43f5e",
  shareCard:      "#fefce8",
  teachPanel:     "#fef9ee",
  filterPanel:    "#ffffff",
};

type Theme = typeof DARK_THEME;

// =============================================================
// CASES FILES + DAILY HELPERS
// =============================================================

const CASES_FILES = [
  "/crimindle cases/crimdle_cases.txt",
];

function getDailyOffset(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const anchor = new Date(DAILY_ANCHOR_DATE.getFullYear(), DAILY_ANCHOR_DATE.getMonth(), DAILY_ANCHOR_DATE.getDate());
  return Math.floor((today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
}

function getDailyCaseId(): number {
  return DAILY_ANCHOR_CASE_ID + getDailyOffset();
}

function getDateForCaseId(caseId: number): string {
  const offset = caseId - DAILY_ANCHOR_CASE_ID;
  const date = new Date(DAILY_ANCHOR_DATE);
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getTodayString(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function generateCaseCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const L = () => letters[Math.floor(Math.random() * letters.length)];
  const N = () => Math.floor(Math.random() * 10);
  return `${L()}${L()}${L()}-${N()}${N()}${N()}`;
}

// =============================================================
// GAVEL ANIMATION
// ============================================================= = [3000, 2400, 1800, 1300, 900, 500];
const GAVEL_LABELS = [
  "Case Filed",
  "Discovery Phase",
  "Pre-Trial Motions",
  "Trial Underway",
  "Closing Arguments",
  "Verdict Imminent",
];
const GAVEL_COLORS = [
  "#d4af37",
  "#c9a227",
  "#c0392b",
  "#a93226",
  "#922b21",
  "#7b241c",
];

function GavelAnimation({ badGuesses, gameOver, won }: { badGuesses: number; gameOver: boolean; won: boolean; }) {
  const [angle, setAngle] = useState(0);
  const [striking, setStriking] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idx = won ? 0 : Math.min(badGuesses, GAVEL_SPEEDS.length - 1);
  const speed = GAVEL_SPEEDS[idx];
  const label = won ? "Verdict: GUILTY ✓" : gameOver && !won ? "MISTRIAL — Case Dismissed" : GAVEL_LABELS[idx];
  const color = won ? "#d4af37" : gameOver && !won ? "#4a0000" : GAVEL_COLORS[idx];
  const broken = gameOver && !won;

  useEffect(() => {
    if (gameOver) { setAngle(won ? -45 : 15); return; }
    const strike = () => {
      setStriking(true); setAngle(-55);
      setTimeout(() => { setAngle(15); setTimeout(() => { setStriking(false); setAngle(0); }, 120); }, 140);
      animRef.current = setTimeout(strike, speed);
    };
    animRef.current = setTimeout(strike, speed);
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [speed, gameOver, won]);

  return (
    <div className="w-full rounded-2xl p-4 border" style={{ background: "#0a0500", borderColor: "#3a2a0a" }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-mono tracking-widest" style={{ color }}>⚖ {label}</span>
        {!gameOver && <span className="text-xs font-mono" style={{ color: "#8a7340" }}>{MAX_GUESSES - badGuesses} guess{MAX_GUESSES - badGuesses !== 1 ? "es" : ""} left</span>}
      </div>
      <div className="flex items-center justify-center" style={{ height: "110px" }}>
        <svg viewBox="0 0 200 110" width="320" height="110" xmlns="http://www.w3.org/2000/svg">
          {striking && (
            <>
              <ellipse cx="148" cy="90" rx="10" ry="4" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
              <ellipse cx="148" cy="90" rx="18" ry="7" fill="none" stroke={color} strokeWidth="0.8" opacity="0.3" />
              <ellipse cx="148" cy="90" rx="26" ry="10" fill="none" stroke={color} strokeWidth="0.5" opacity="0.15" />
            </>
          )}
          <rect x="120" y="88" width="56" height="10" rx="2" fill={broken ? "#2a0000" : "#5c3d1e"} />
          <rect x="124" y="85" width="48" height="6" rx="1" fill={broken ? "#1a0000" : "#7a5230"} />
          <g transform={`rotate(${angle}, 80, 85)`} style={{ transition: striking ? "transform 0.14s ease-in" : "transform 0.12s ease-out" }}>
            <rect x="76" y="30" width="8" height="58" rx="3" fill={broken ? "#3a1a1a" : "#8b5e3c"} />
            <rect x="77" y="30" width="3" height="58" rx="2" fill={broken ? "#4a2222" : "#a0714f"} opacity="0.5" />
            <rect x="50" y="20" width="60" height="22" rx="4" fill={broken ? "#2a0000" : color} />
            <rect x="50" y="20" width="60" height="8" rx="4" fill={broken ? "#3a0000" : "#e8c84a"} opacity="0.3" />
            {broken && (
              <>
                <line x1="78" y1="20" x2="74" y2="42" stroke="#ff4444" strokeWidth="1.5" opacity="0.7" />
                <line x1="82" y1="20" x2="86" y2="42" stroke="#ff4444" strokeWidth="1" opacity="0.5" />
              </>
            )}
          </g>
        </svg>
      </div>
      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "#1a1000" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: won ? "100%" : broken ? "0%" : `${((MAX_GUESSES - badGuesses) / MAX_GUESSES) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

// =============================================================
// NORMALIZATION HELPERS
// =============================================================

function normalizeAnswer(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const CANONICAL_DIAGNOSIS_MAP: Record<string, string> = {
  murderfirstdegree: "First-degree murder",
  firstdegreemurder: "First-degree murder",
  murder1: "First-degree murder",
  murderone: "First-degree murder",
  premeditatdmurder: "First-degree murder",
  murdersecondegree: "Second-degree murder",
  seconddegreemurder: "Second-degree murder",
  murder2: "Second-degree murder",
  murdertwo: "Second-degree murder",
  felonymurder: "Felony murder",
  voluntarymanslaughter: "Voluntary manslaughter",
  involuntarymanslaughter: "Involuntary manslaughter",
  criminalnegligencehomicide: "Involuntary manslaughter",
  dui: "Driving under the influence (DUI)",
  dwi: "Driving under the influence (DUI)",
  drivingunderinfluence: "Driving under the influence (DUI)",
  burglary: "Burglary",
  robbery: "Robbery",
  armedrobbery: "Robbery",
  larceny: "Larceny",
  theft: "Larceny",
  grandlarceny: "Grand larceny",
  petitlarceny: "Petit larceny",
  assault: "Assault",
  battery: "Battery",
  agravatedassault: "Aggravated assault",
  aggravatedassault: "Aggravated assault",
  rape: "Rape",
  sexualassault: "Sexual assault",
  kidnapping: "Kidnapping",
  falsimprisonment: "False imprisonment",
  falseimprisonment: "False imprisonment",
  arson: "Arson",
  fraud: "Fraud",
  embezzlement: "Embezzlement",
  extortion: "Extortion",
  bribery: "Bribery",
  perjury: "Perjury",
  obstruction: "Obstruction of justice",
  obstructionofjustice: "Obstruction of justice",
  conspiracy: "Conspiracy",
  attempt: "Criminal attempt",
  criminalattempt: "Criminal attempt",
  solicitation: "Criminal solicitation",
  criminalsolicitation: "Criminal solicitation",
  trespass: "Criminal trespass",
  criminaltrespass: "Criminal trespass",
  breakandentering: "Burglary",
  receivingstolengoods: "Receiving stolen property",
  identitytheft: "Identity theft",
  cybercrime: "Computer fraud",
  stalking: "Stalking",
  harassment: "Criminal harassment",
};

function normalizeKeyForDedup(input: string) {
  const lower = input.toLowerCase().trim();
  const compact = lower.replace(/&/g, "and").replace(/\s+/g, " ");
  return compact.replace(/[^a-z0-9]+/g, "");
}

function canonicalizeDiagnosisDisplay(raw: string) {
  const key = normalizeKeyForDedup(raw);
  return CANONICAL_DIAGNOSIS_MAP[key] || raw;
}

function normalizeSystem(system?: string) {
  if (!system) return "";
  return system.toLowerCase().trim().replace(/\//g, "_").replace(/\s+/g, "_").replace(/-+/g, "_");
}

function displaySystemLabel(system?: string) {
  const s = normalizeSystem(system);
  if (!s) return "";
  return s.split("_").map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

// =============================================================
// CRIMINAL LAW DIAGNOSIS BANK
// =============================================================

const CRIMINAL_LAW_BANK: string[] = [
  // Homicide
  "First-degree murder",
  "Second-degree murder",
  "Felony murder",
  "Voluntary manslaughter",
  "Involuntary manslaughter",
  "Criminally negligent homicide",
  // Crimes against persons
  "Assault",
  "Battery",
  "Aggravated assault",
  "Aggravated battery",
  "Rape",
  "Sexual assault",
  "Statutory rape",
  "Kidnapping",
  "False imprisonment",
  "Stalking",
  "Criminal harassment",
  "Domestic violence",
  "Child abuse",
  "Elder abuse",
  // Property crimes
  "Burglary",
  "Robbery",
  "Armed robbery",
  "Grand larceny",
  "Petit larceny",
  "Larceny",
  "Shoplifting",
  "Carjacking",
  "Arson",
  "Vandalism",
  "Criminal trespass",
  "Receiving stolen property",
  "Auto theft",
  // White collar / fraud
  "Fraud",
  "Wire fraud",
  "Mail fraud",
  "Bank fraud",
  "Securities fraud",
  "Insurance fraud",
  "Tax evasion",
  "Money laundering",
  "Embezzlement",
  "Bribery",
  "Extortion",
  "Blackmail",
  "Forgery",
  "Counterfeiting",
  "Identity theft",
  "Ponzi scheme",
  "Computer fraud",
  // Drug offenses
  "Drug possession",
  "Drug trafficking",
  "Drug manufacturing",
  "Drug distribution",
  "Possession with intent to distribute",
  // Inchoate crimes
  "Conspiracy",
  "Criminal attempt",
  "Criminal solicitation",
  "Criminal facilitation",
  // Obstruction / process crimes
  "Perjury",
  "Obstruction of justice",
  "Tampering with evidence",
  "Witness tampering",
  "Bribery of a public official",
  "Contempt of court",
  "Escape from custody",
  // Traffic
  "Driving under the influence (DUI)",
  "Vehicular homicide",
  "Reckless driving",
  "Hit and run",
  // Public order
  "Disorderly conduct",
  "Riot",
  "Incitement to riot",
  "Public intoxication",
  "Loitering",
  "Trespassing",
  // Weapons
  "Unlawful possession of a firearm",
  "Carrying a concealed weapon",
  "Felon in possession of a firearm",
  "Illegal weapons trafficking",
  // Sexual offenses
  "Indecent exposure",
  "Public lewdness",
  "Child pornography",
  "Prostitution",
  "Solicitation of prostitution",
  // Defenses and special doctrines
  "Insanity defense",
  "Self-defense",
  "Defense of others",
  "Entrapment",
  "Duress",
  "Necessity defense",
];

// =============================================================
// CASE PARSING
// =============================================================

function parseCases(text: string): Case[] {
  const blocks = text.split(/\n={10,}\n/).map((block) => block.trim()).filter(Boolean);
  const cases: Case[] = [];

  for (const block of blocks) {
    const idMatch = block.match(/CASE_ID:\s*(\d+)/);
    const diagMatch = block.match(/DIAGNOSIS:\s*\n([^\n]+)/);
    const aliasMatch = block.match(/ALIASES:\s*\n([\s\S]*?)(?=\nVIGNETTE_LINES:)/);
    const clueMatch = block.match(/VIGNETTE_LINES:\s*\n([\s\S]*?)(?=\nTEACHING_POINTS:|\nCASE_ID:|$)/);
    const teachMatch = block.match(/TEACHING_POINTS:\s*\n([\s\S]*?)(?=\n={10,}|$)/);
    const difficultyMatch = block.match(/DIFFICULTY:\s*\n?([^\n]+)/);
    const systemMatch = block.match(/SYSTEM:\s*\n?([^\n]+)/);

    if (!idMatch || !diagMatch || !clueMatch) continue;

    const diagnosis = diagMatch[1].trim();
    const aliases = aliasMatch ? aliasMatch[1].split("\n").map((a) => a.replace(/^[-\s]+/, "").trim()).filter(Boolean) : [];
    const clues = clueMatch[1].split("\n").map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-\s]+/, "").trim()).filter(Boolean);
    const teachingPoints = teachMatch ? teachMatch[1].split("\n").map((line) => line.replace(/^[-\s]+/, "").trim()).filter(Boolean) : [];

    cases.push({
      id: idMatch[1], diagnosis, aliases, clues, teachingPoints,
      difficulty: difficultyMatch?.[1].trim(),
      system: normalizeSystem(systemMatch?.[1].trim()),
    });
  }

  return cases.sort((a, b) => Number(a.id) - Number(b.id));
}

function dedupeCasesById(list: Case[]): Case[] {
  const map = new Map<string, Case>();
  for (const c of list) {
    const prev = map.get(c.id);
    if (!prev) { map.set(c.id, c); continue; }
    const prevScore = (prev.clues?.length || 0) * 1000 + (prev.teachingPoints?.length || 0) * 10 + (prev.diagnosis?.length || 0);
    const curScore = (c.clues?.length || 0) * 1000 + (c.teachingPoints?.length || 0) * 10 + (c.diagnosis?.length || 0);
    if (curScore > prevScore) map.set(c.id, c);
  }
  return Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

// =============================================================
// CONFETTI
// =============================================================

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = ["#d4af37", "#c0392b", "#e8c84a", "#f5e6a3", "#ffffff", "#922b21", "#f0c040"];
    const pieces = Array.from({ length: 200 }, () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height, r: Math.random() * 7 + 3, color: colors[Math.floor(Math.random() * colors.length)], tiltAngle: Math.random() * Math.PI * 2, tiltSpeed: Math.random() * 0.07 + 0.03, speed: Math.random() * 2.5 + 1.5 }));
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => { p.tiltAngle += p.tiltSpeed; p.y += p.speed; const tilt = Math.sin(p.tiltAngle) * 14; ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + tilt + p.r / 2, p.y); ctx.lineTo(p.x + tilt, p.y + tilt + p.r / 2); ctx.stroke(); if (p.y > canvas.height) p.y = -10; });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const stop = setTimeout(() => cancelAnimationFrame(animId), 5000);
    return () => { cancelAnimationFrame(animId); clearTimeout(stop); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// =============================================================
// SHARE + RESULT MODAL
// =============================================================

function ShareCard({ shareText, theme }: { shareText: string; theme: Theme }) {
  const [copied, setCopied] = useState(false);
  const copyShareText = async () => {
    try { await navigator.clipboard.writeText(shareText); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* no-op */ }
  };
  return (
    <div className="mt-4 rounded-2xl p-4 text-left" style={{ background: theme.shareCard, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>Share result</p>
        <button onClick={copyShareText} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: theme.accent, color: "#0d0800" }}>{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-6 font-mono" style={{ color: theme.text }}>{shareText}</pre>
    </div>
  );
}

function ResultModal({ won, current, guesses, solvedAtClueCount, onArchive, onRandom, onBackToDaily, caseMode, theme }: {
  won: boolean; current: Case; guesses: Guess[]; solvedAtClueCount: number;
  onArchive: () => void; onRandom: () => void; onBackToDaily: () => void;
  caseMode: "daily" | "archive" | "random"; theme: Theme;
}) {
  const [showTeaching, setShowTeaching] = useState(false);
  const shareText = useMemo(() => {
    if (!won) return "";
    const gold = Math.max(1, Math.min(solvedAtClueCount, MAX_GUESSES));
    const white = Math.max(0, MAX_GUESSES - gold);
    return `CRIMINDLE ⚖️\nVerdicted in ${gold} clue${gold === 1 ? "" : "s"}\n${"🟨".repeat(gold)}${"⬜".repeat(white)}`;
  }, [won, solvedAtClueCount]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.82)" }}>
      <div className="w-full max-w-lg rounded-2xl p-7 text-center shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: won ? theme.modalWin : theme.modalLose, border: `1px solid ${won ? theme.modalBorderWin : theme.modalBorderLose}` }}>
        {won ? (
          <>
            <p className="text-5xl mb-3">⚖️</p>
            <p className="text-3xl font-bold mb-1" style={{ color: theme.accent }}>Verdict: Guilty!</p>
            <p className="font-semibold text-xl mb-1" style={{ color: theme.text }}>{current.diagnosis}</p>
            <p className="text-sm mb-1" style={{ color: theme.textMuted }}>Charged in {guesses.length} guess{guesses.length !== 1 ? "es" : ""}.</p>
            <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Solved at clue {solvedAtClueCount}.</p>
            <ShareCard shareText={shareText} theme={theme} />
          </>
        ) : (
          <>
            <p className="text-5xl mb-3">🔨</p>
            <p className="text-3xl font-bold mb-1" style={{ color: "#c0392b" }}>Case Dismissed</p>
            <p className="text-sm mb-1" style={{ color: theme.textMuted }}>The charge was:</p>
            <p className="text-2xl font-bold mb-4" style={{ color: theme.text }}>{current.diagnosis}</p>
          </>
        )}
        {current.teachingPoints.length > 0 && (
          <div className="mb-4">
            <button onClick={() => setShowTeaching((s) => !s)} className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: theme.bgCard, color: theme.accent, border: `1px solid ${theme.accent}` }}>
              {showTeaching ? "Hide" : "⚖️ Show"} Legal Notes
            </button>
            {showTeaching && (
              <div className="mt-3 rounded-xl p-4 text-left space-y-2" style={{ background: theme.teachPanel }}>
                {current.teachingPoints.map((pt, i) => (
                  <p key={i} className="text-sm" style={{ color: theme.textMuted }}><span style={{ color: theme.accent }}>•</span> {pt}</p>
                ))}
              </div>
            )}
          </div>
        )}
        {caseMode === "daily" ? (
          <div className="flex gap-2 mt-2">
            <button onClick={onArchive} className="flex-1 py-3 rounded-xl font-bold text-base" style={{ background: theme.accent, color: "#0d0800" }}>📅 Play Archive</button>
            <button onClick={onRandom} className="flex-1 py-3 rounded-xl font-bold text-base" style={{ background: theme.bgCard, color: theme.accent, border: `1px solid ${theme.accent}` }}>♾️ Endless Mode</button>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <button onClick={onArchive} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: theme.accent, color: "#0d0800" }}>📅 Archive</button>
            <button onClick={onRandom} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: theme.bgCard, color: theme.accent, border: `1px solid ${theme.accent}` }}>♾️ Endless</button>
            <button onClick={onBackToDaily} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: theme.bgCard, color: theme.accent, border: `1px solid ${theme.accent}` }}>📆 Today</button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================
// MAIN COMPONENT
// =============================================================

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [randomCases, setRandomCases] = useState<Case[]>([]);
  const [current, setCurrent] = useState<Case | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(1);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showGavel, setShowGavel] = useState(true);
  const [showSystem, setShowSystem] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const theme: Theme = lightMode ? LIGHT_THEME : DARK_THEME;
  const [showSystemFilter, setShowSystemFilter] = useState(false);
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(new Set());
  const [solvedAtClueCount, setSolvedAtClueCount] = useState(1);
  const [loadError, setLoadError] = useState("");
  const [dailyCaseId, setDailyCaseId] = useState<number>(0);
  const [caseMode, setCaseMode] = useState<"daily" | "archive" | "random">("daily");
  const [randomCaseCode, setRandomCaseCode] = useState<string>("");

  const resetRound = useCallback((nextCase: Case) => {
    setCurrent(nextCase); setSelectedCaseId(nextCase.id); setRevealed(1); setGuess(""); setGuesses([]);
    setGameOver(false); setWon(false); setShowDropdown(false); setShowConfetti(false);
    setShowGavel(true); setSolvedAtClueCount(1);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadCases() {
      try {
        const responses = await Promise.all(CASES_FILES.map(async (path) => { const r = await fetch(path); if (!r.ok) throw new Error(`Failed to load cases from ${path}`); return r.text(); }));
        const parsed = dedupeCasesById(parseCases(responses.join("\n\n")));
        if (!active) return;
        setCases(parsed);
        if (parsed.length === 0) { setLoadError("No cases were parsed from any file."); return; }
        const todayId = getDailyCaseId();
        setDailyCaseId(todayId);
        const daily = parsed.find((c) => Number(c.id) === todayId) ?? parsed[0];
        setCurrent(daily); setSelectedCaseId(daily.id); setSeenIds(new Set([daily.id]));
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load cases.");
      }
    }
    loadCases();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadRandomCases() {
      try {
        const res = await fetch(RANDOM_CASES_FILE);
        if (!res.ok) return;
        const parsed = dedupeCasesById(parseCases(await res.text()));
        if (!active) return;
        setRandomCases(parsed);
      } catch { /* optional file */ }
    }
    loadRandomCases();
    return () => { active = false; };
  }, []);

  const allSystems = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => { if (c.system) set.add(normalizeSystem(c.system)); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cases]);

  const eligibleCases = useMemo(() => {
    const base = selectedSystems.size === 0 ? cases : cases.filter((c) => c.system && selectedSystems.has(normalizeSystem(c.system)));
    return dedupeCasesById(base);
  }, [cases, selectedSystems]);

  const toggleSystem = useCallback((system: string) => {
    setSelectedSystems((prev) => { const next = new Set(prev); const key = normalizeSystem(system); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }, []);

  useEffect(() => {
    if (!current || selectedSystems.size === 0) return;
    const curSys = normalizeSystem(current.system);
    if (curSys && selectedSystems.has(curSys)) return;
    if (eligibleCases.length === 0) return;
    const next = eligibleCases[Math.floor(Math.random() * eligibleCases.length)];
    setSeenIds(new Set([next.id])); resetRound(next);
  }, [current, eligibleCases, selectedSystems, resetRound]);

  const loadCaseById = useCallback((caseId: string) => {
    if (!eligibleCases.length) return;
    const nextCase = eligibleCases.find((c) => c.id === caseId);
    if (!nextCase) return;
    setSeenIds(new Set([nextCase.id])); resetRound(nextCase);
  }, [eligibleCases, resetRound]);

  const startArchiveCase = useCallback(() => {
    const pool = eligibleCases.filter((c) => { const id = Number(c.id); return id >= ARCHIVE_START && id < dailyCaseId; });
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setCaseMode("archive"); setRandomCaseCode(""); setSeenIds(new Set([next.id])); resetRound(next);
  }, [eligibleCases, dailyCaseId, resetRound]);

  const startRandomCase = useCallback(() => {
    const externalPool = randomCases;
    const fallbackPool = eligibleCases.filter((c) => Number(c.id) <= RANDOM_POOL_MAX);
    const pool = externalPool.length > 0 ? externalPool : fallbackPool;
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setCaseMode("random"); setRandomCaseCode(generateCaseCode()); setSeenIds(new Set([next.id])); resetRound(next);
  }, [eligibleCases, randomCases, resetRound]);

  const startDailyCase = useCallback(() => {
    const daily = eligibleCases.find((c) => Number(c.id) === dailyCaseId);
    if (!daily) return;
    setCaseMode("daily"); setRandomCaseCode(""); setSeenIds(new Set([daily.id])); resetRound(daily);
  }, [eligibleCases, dailyCaseId, resetRound]);

  const allDiagnoses = useMemo(() => {
    const fromCases = eligibleCases.flatMap((c) => [c.diagnosis, ...c.aliases]);
    const combined = [...CRIMINAL_LAW_BANK, ...fromCases];
    const map = new Map<string, string>();
    for (const item of combined) {
      const canonical = canonicalizeDiagnosisDisplay(item);
      const key = normalizeKeyForDedup(canonical);
      const prev = map.get(key);
      if (!prev || canonical.length > prev.length) map.set(key, canonical);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [eligibleCases]);

  const caseOptions = useMemo(() => {
    const maxAllowed = dailyCaseId > 0 ? dailyCaseId : 0;
    const options = eligibleCases
      .filter((c) => { const id = Number(c.id); return id >= ARCHIVE_START && id <= maxAllowed; })
      .map((c) => {
        const id = Number(c.id);
        const isToday = id === dailyCaseId;
        const systemPart = showSystem && c.system ? ` • ${displaySystemLabel(c.system)}` : "";
        const datePart = isToday ? " ⚖️ Today" : ` — ${getDateForCaseId(id)}`;
        return { id: c.id, label: `Case ${c.id}${systemPart}${datePart}` };
      });
    if (caseMode === "random") return [{ id: "__endless__", label: "♾️ Endless Mode" }, ...options];
    return options;
  }, [eligibleCases, showSystem, dailyCaseId, caseMode]);

  const filtered = useMemo(() => {
    const q = guess.trim().toLowerCase();
    if (!q) return [];
    const qKey = normalizeKeyForDedup(q);
    return allDiagnoses.filter((d) => d.toLowerCase().includes(q) || normalizeKeyForDedup(d).includes(qKey)).slice(0, 10);
  }, [allDiagnoses, guess]);

  const badGuesses = guesses.filter((g) => !g.correct).length;
  const guessesLeft = MAX_GUESSES - guesses.length;

  const submitGuess = useCallback((text: string, skipped = false) => {
    if (!current || gameOver) return;
    const g = text.trim();
    if (!g && !skipped) return;
    const correct = !skipped && [current.diagnosis, ...current.aliases].some((answer) => {
      const aCanon = canonicalizeDiagnosisDisplay(answer);
      const gCanon = canonicalizeDiagnosisDisplay(g);
      return normalizeKeyForDedup(aCanon) === normalizeKeyForDedup(gCanon) || normalizeAnswer(answer) === normalizeAnswer(g);
    });
    const newGuesses = [...guesses, { text: skipped ? "Skipped" : g, correct, skipped }];
    setGuesses(newGuesses); setGuess(""); setShowDropdown(false);
    if (correct) { setWon(true); setGameOver(true); setShowConfetti(true); setSolvedAtClueCount(revealed); return; }
    setRevealed((prev) => Math.min(prev + 1, current.clues.length));
    if (newGuesses.length >= MAX_GUESSES) setGameOver(true);
  }, [current, gameOver, guesses, revealed]);

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: DARK_THEME.bg, fontFamily: "'Poppins', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
        <div className="max-w-xl rounded-2xl p-6 border" style={{ background: DARK_THEME.bgCard, borderColor: DARK_THEME.border }}>
          <p className="text-white text-lg font-semibold mb-2">Could not load the cases file.</p>
          <p className="text-sm" style={{ color: DARK_THEME.textMuted }}>{loadError}</p>
          <p className="text-sm mt-3" style={{ color: DARK_THEME.textMuted }}>Put your cases file in <span className="font-mono">public/crimindle cases/</span> and add it to <span className="font-mono">CASES_FILES</span>.</p>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: DARK_THEME.bg, fontFamily: "'Poppins', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
        <p className="text-white text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 pb-16 transition-colors duration-300" style={{ background: theme.bg, fontFamily: "'Poppins', sans-serif", color: theme.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
      {showConfetti && <Confetti />}
      <Analytics />

      {gameOver && current && <ResultModal won={won} current={current} guesses={guesses} solvedAtClueCount={solvedAtClueCount} onArchive={startArchiveCase} onRandom={startRandomCase} onBackToDaily={startDailyCase} caseMode={caseMode} theme={theme} />}

      {/* OTHER GAMES DROPDOWN */}
      <div style={{ position: "absolute", top: "16px", left: "16px" }}>
        <select
          onChange={(e) => {
            if (e.target.value === "medicle") window.location.href = "/";
            if (e.target.value === "vettle") window.location.href = "/vettle";
            if (e.target.value === "psychodle") window.location.href = "/psychodle";
            if (e.target.value === "dentdle") window.location.href = "/dentdle";
            if (e.target.value === "crimindle") window.location.href = "/crimindle";
          }}
          defaultValue="crimindle"
          style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}
        >
          <option value="crimindle">⚖️ Crimindle — Criminal Law</option>
          <option value="medicle">🧠 Medicle</option>
          <option value="vettle">🐾 Vettle — Veterinary cases</option>
          <option value="psychodle">🧩 Psychodle — Psychiatry cases</option>
          <option value="dentdle">🦷 Dentdle — Dental cases</option>
        </select>
      </div>

      {/* LIGHT/DARK TOGGLE */}
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <button onClick={() => setLightMode((v) => !v)} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontFamily: "'Poppins', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
          {lightMode ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {/* HEADER */}
      <div style={{ marginTop: "32px", marginBottom: "18px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px", width: "100%", maxWidth: "720px" }}>

        {/* LOGO — panel only in light mode */}
        {lightMode ? (
          <div style={{ background: theme.logoPanel, border: `1px solid ${theme.logoBorder}`, borderRadius: "20px", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
            <img src="/crimindle-logo.png" alt="Crimindle" style={{ height: "72px" }} />
          </div>
        ) : (
          <img src="/crimindle-logo.png" alt="Crimindle" style={{ height: "72px" }} />
        )}

        {/* INFO PANEL */}
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: "16px", padding: "16px 20px", width: "100%" }}>
          <p style={{ fontSize: "15px", color: theme.text, fontWeight: "600", marginBottom: "6px" }}>Can you identify the crime before the gavel falls?</p>
          <p style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "8px" }}>Endless progressive criminal law vignettes. A new case every round.</p>
          <a href="https://www.medicle.net/crimindle" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", fontWeight: "bold", color: theme.accent, textDecoration: "none" }}>🔗 www.medicle.net/crimindle</a>
        </div>

        {/* CASE SELECTOR */}
        <div className="w-full grid gap-3 sm:grid-cols-[1fr_auto] items-center">
          <div className="text-left">
            <label className="block text-xs font-mono tracking-widest mb-1" style={{ color: theme.textMuted }}>Jump to case</label>
            <select
              value={caseMode === "random" ? "__endless__" : selectedCaseId}
              onChange={(e) => { if (e.target.value === "__endless__") return; loadCaseById(e.target.value); }}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: theme.selectBg, border: `1px solid ${theme.border}`, color: theme.text, fontFamily: "'Poppins', sans-serif" }}
              disabled={!eligibleCases.length}
            >
              {caseOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>
          {current && (
            <div className="sm:text-right text-left">
              {caseMode === "random" ? (
                <>
                  <p className="text-xs font-mono tracking-widest" style={{ color: theme.textMuted }}>ENDLESS MODE</p>
                  <p className="text-sm font-bold font-mono" style={{ color: theme.accent }}>♾️ {randomCaseCode}</p>
                </>
              ) : caseMode === "archive" ? (
                <>
                  <p className="text-xs font-mono tracking-widest" style={{ color: theme.textMuted }}>ARCHIVE</p>
                  <p className="text-sm font-bold" style={{ color: theme.accent }}>📅 {getDateForCaseId(Number(current.id))}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-mono tracking-widest" style={{ color: theme.textMuted }}>TODAY&apos;S CASE</p>
                  <p className="text-sm font-bold" style={{ color: theme.accent }}>⚖️ {getTodayString()}</p>
                </>
              )}
              {showSystem && current.system && <p className="text-xs mt-1" style={{ color: theme.accent }}>{displaySystemLabel(current.system)}</p>}
            </div>
          )}
        </div>
      </div>

      {/* PROGRESS BAR — capped at MAX_GUESSES */}
      <div className="flex items-center gap-2 mb-3 text-sm w-full max-w-3xl" style={{ color: theme.textMuted }}>
        <span className="whitespace-nowrap">Clue {revealed}/{Math.min(current.clues.length, MAX_GUESSES)}</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(revealed / Math.min(current.clues.length, MAX_GUESSES)) * 100}%`, background: theme.accent }} />
        </div>
        <span className="text-xs font-mono whitespace-nowrap" style={{ color: theme.textMuted }}>{guessesLeft} guess{guessesLeft !== 1 ? "es" : ""} left</span>
      </div>

      {/* CLUES */}
      <div className="w-full max-w-3xl space-y-2 mb-4">
        {current.clues.slice(0, revealed).map((clue, i) => (
          <div key={i} className="rounded-xl px-4 py-3 text-sm border-l-4 transition-all duration-300" style={{ background: theme.bgCard, borderColor: i === revealed - 1 ? theme.accent : theme.border, color: theme.text }}>
            <span className="text-xs font-mono mr-2" style={{ color: theme.clueNum }}>#{i + 1}</span>
            {clue}
          </div>
        ))}
      </div>

      {/* INPUT + DROPDOWN */}
      {!gameOver && (
        <div className="relative w-full max-w-3xl mb-2">
          <div className="flex gap-2">
            <input className="min-w-0 flex-1 rounded-xl px-3 py-2 outline-none text-sm" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.text, fontFamily: "'Poppins', sans-serif" }} placeholder="Enter the charge or crime..." value={guess}
              onChange={(e) => { setGuess(e.target.value); setShowDropdown(true); }}
              onKeyDown={(e) => e.key === "Enter" && submitGuess(guess)}
              onFocus={() => setShowDropdown(true)}
            />
            <button onClick={() => submitGuess(guess)} className="py-2 rounded-xl font-bold text-sm shrink-0" style={{ background: theme.accent, color: "#0d0800", minWidth: "64px", fontFamily: "'Poppins', sans-serif" }}>Charge</button>
            <button onClick={() => submitGuess("", true)} className="py-2 rounded-xl font-bold text-sm shrink-0" style={{ background: theme.border, color: theme.text, minWidth: "52px", fontFamily: "'Poppins', sans-serif" }}>Skip</button>
          </div>
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-10 w-full rounded-xl mt-1 overflow-hidden shadow-lg" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
              {filtered.map((d, i) => (
                <div key={i} className="px-4 py-2 cursor-pointer text-sm" style={{ borderBottom: `1px solid ${theme.border}`, color: theme.text }}
                  onMouseDown={() => submitGuess(d)}
                  onMouseOver={(e) => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = "#0d0800"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = theme.text; }}
                >{d}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GUESS HISTORY */}
      <div className="mt-2 space-y-1 w-full max-w-3xl">
        {guesses.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span style={{ color: g.skipped ? theme.textMuted : g.correct ? theme.accent : "#c0392b" }}>{g.skipped ? "—" : g.correct ? "✓" : "✗"}</span>
            <span style={{ color: g.skipped ? theme.textMuted : g.correct ? theme.accent : "#c0392b" }}>{g.text}</span>
          </div>
        ))}
      </div>

      {/* GAVEL + FILTER BUTTONS */}
      <div className="mt-8 w-full max-w-3xl">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button onClick={() => setShowGavel((s) => !s)} className="flex items-center gap-2 text-xs font-mono mb-2 px-3 py-1 rounded-lg transition-all" style={{ background: showGavel ? theme.bgCard : "transparent", border: `1px solid ${theme.border}`, color: showGavel ? theme.accent : theme.textFaint, fontFamily: "'Poppins', sans-serif" }}>
            <span style={{ color: showGavel ? theme.accent : theme.textFaint }}>●</span>{showGavel ? "Hide" : "Show"} Courtroom Status
          </button>
          <button onClick={() => setShowSystem((s) => !s)} className="flex items-center gap-2 text-xs font-mono mb-2 px-3 py-1 rounded-lg transition-all" style={{ background: showSystem ? theme.bgCard : "transparent", border: `1px solid ${theme.border}`, color: showSystem ? theme.accent : theme.textFaint, fontFamily: "'Poppins', sans-serif" }}>
            <span style={{ color: showSystem ? theme.accent : theme.textFaint }}>●</span>{showSystem ? "Hide" : "Show"} Area of Law
          </button>
          <button onClick={() => setShowSystemFilter((s) => !s)} className="flex items-center gap-2 text-xs font-mono mb-2 px-3 py-1 rounded-lg transition-all" style={{ background: showSystemFilter ? theme.bgCard : "transparent", border: `1px solid ${theme.border}`, color: showSystemFilter ? theme.accent : theme.textFaint, fontFamily: "'Poppins', sans-serif" }}>
            <span style={{ color: selectedSystems.size > 0 ? theme.accent : theme.textFaint }}>●</span>Filter Area{selectedSystems.size > 0 ? ` (${selectedSystems.size})` : ""}
          </button>
        </div>

        {showSystemFilter && (
          <div className="w-full rounded-xl p-3 border mb-2" style={{ background: theme.filterPanel, borderColor: theme.border }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-mono tracking-widest" style={{ color: theme.textMuted }}>FILTER BY AREA OF LAW (OPTIONAL)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedSystems(new Set())} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: theme.border, color: theme.text }}>Clear</button>
                <button onClick={() => setSelectedSystems(new Set(allSystems))} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: theme.accent, color: "#0d0800" }}>Select all</button>
              </div>
            </div>
            {allSystems.length === 0 ? (
              <p className="text-sm mt-2" style={{ color: theme.textMuted }}>No area tags were found in your cases file.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {allSystems.map((sys) => (
                  <label key={sys} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer select-none" style={{ background: selectedSystems.has(sys) ? `${theme.accent}22` : "transparent", borderColor: selectedSystems.has(sys) ? theme.accent : theme.border, color: selectedSystems.has(sys) ? theme.text : theme.textMuted }}>
                    <input type="checkbox" checked={selectedSystems.has(sys)} onChange={() => toggleSystem(sys)} style={{ accentColor: theme.accent }} />
                    <span>{displaySystemLabel(sys)}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedSystems.size > 0 && <p className="text-xs mt-3" style={{ color: theme.textFaint }}>Active filter: {Array.from(selectedSystems).map(displaySystemLabel).join(", ")}</p>}
            <p className="text-xs mt-2" style={{ color: theme.textFaint }}>Tip: Picking areas here limits new cases to those categories for this session.</p>
          </div>
        )}

        {showGavel && <GavelAnimation badGuesses={badGuesses} gameOver={gameOver} won={won} />}
      </div>

      {/* FOOTER */}
      <div className="mt-8 w-full max-w-3xl text-center space-y-3">
        <p className="text-xs" style={{ color: theme.textFaint }}>⚠️ Cases are AI-generated for educational purposes only and may contain inaccuracies. Not for legal advice or professional use.</p>
        <p className="text-xs" style={{ color: theme.textFaint }}>
          Crimindle is part of the Medicle family of educational games, inspired by{" "}
          <a href="https://doctordle.org" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>Doctordle</a>
          . Built for students to practice endlessly.
        </p>
        <p className="text-xs" style={{ color: theme.textFaint }}>
          Questions or feedback?{" "}
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSe6EvwFZl8bNjuiICiyTB-lekERWn_L32p_fR6Wu8qIETYBmw/viewform" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, fontWeight: 600 }}>
            Leave us feedback →
          </a>
        </p>
      </div>
    </main>
  );
}
