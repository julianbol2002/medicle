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
// THEME TOKENS
// =============================================================

const DARK_THEME = {
  bg:             "#1f1810",
  bgCard:         "#2e2218",
  bgInput:        "#2e2218",
  border:         "#5a4430",
  text:           "#f5e6d3",
  textMuted:      "#c2a98d",
  textFaint:      "#8a6a4a",
  accent:         "#d97706",
  selectBg:       "#2e2218",
  modalWin:       "#2a2018",
  modalLose:      "#2d0a0a",
  modalBorderWin: "#22c55e",
  modalBorderLose:"#dc2626",
  shareCard:      "#2e2218",
  teachPanel:     "#1f1810",
};

const LIGHT_THEME = {
  bg:             "#fdf8f0",
  bgCard:         "#ffffff",
  bgInput:        "#ffffff",
  border:         "#e8d5bc",
  text:           "#1c1009",
  textMuted:      "#78502a",
  textFaint:      "#a87a50",
  accent:         "#d97706",
  selectBg:       "#ffffff",
  modalWin:       "#fffbeb",
  modalLose:      "#fff1f2",
  modalBorderWin: "#22c55e",
  modalBorderLose:"#dc2626",
  shareCard:      "#fffbeb",
  teachPanel:     "#fef9ee",
};

type Theme = typeof DARK_THEME;

// =============================================================
// DAILY CASE SYSTEM
// =============================================================

const DAILY_ANCHOR_DATE = new Date("2026-06-04T00:00:00");
const DAILY_ANCHOR_CASE_ID = 111;
const ARCHIVE_START = 101;

const DAILY_CASES_FILE = "/vettle cases/cases_vettle_navle.txt";
const ENDLESS_CASES_FILE = "/vettle cases/vettle_random_cases.txt";

function getDailyOffset(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const anchor = new Date(
    DAILY_ANCHOR_DATE.getFullYear(),
    DAILY_ANCHOR_DATE.getMonth(),
    DAILY_ANCHOR_DATE.getDate()
  );
  return Math.floor((today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24));
}

function getSequentialDailyCaseId(): number {
  return DAILY_ANCHOR_CASE_ID + getDailyOffset();
}

function getMaxCaseId(caseList: Case[]): number {
  if (!caseList.length) return 0;
  return Math.max(...caseList.map((c) => Number(c.id)));
}

function getPlayableDailyCaseId(sequentialId: number, caseList: Case[]): number {
  const maxId = getMaxCaseId(caseList);
  if (!maxId) return DAILY_ANCHOR_CASE_ID;
  return Math.min(sequentialId, maxId);
}

function findCaseByNumericId(caseList: Case[], numericId: number): Case | undefined {
  return caseList.find((c) => Number(c.id) === numericId);
}

function getDateForCaseId(caseId: number): string {
  const offset = caseId - DAILY_ANCHOR_CASE_ID;
  const date = new Date(DAILY_ANCHOR_DATE);
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}


// =============================================================
// NORMALIZATION HELPERS
// =============================================================

function normalizeAnswer(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const CANONICAL_DIAGNOSIS_MAP: Record<string, string> = {
  // Common NAVLE duplicates
  gi: "Gastrointestinal disease",
  colic: "Colic (equine)",
  equinecolic: "Colic (equine)",
  bloat: "Bloat (GDV)",
  gdv: "Bloat (GDV)",
  gastricdilatationvolvulus: "Bloat (GDV)",
  parvo: "Parvovirus infection",
  parvovirusinfection: "Parvovirus infection",
  canineepilepsyidiopathic: "Idiopathic epilepsy",
  idiopathicepilepsy: "Idiopathic epilepsy",
  fip: "Feline infectious peritonitis (FIP)",
  felineinfectiousperitonitis: "Feline infectious peritonitis (FIP)",
  felv: "Feline leukemia virus (FeLV)",
  felineleukemiavirus: "Feline leukemia virus (FeLV)",
  fiv: "Feline immunodeficiency virus (FIV)",
  felineimmunodeficiencyvirus: "Feline immunodeficiency virus (FIV)",
  hypothyroid: "Hypothyroidism",
  hypothyroidism: "Hypothyroidism",
  hyperthyroid: "Hyperthyroidism",
  hyperthyroidism: "Hyperthyroidism",
  cushings: "Hyperadrenocorticism (Cushing's)",
  hyperadrenocorticism: "Hyperadrenocorticism (Cushing's)",
  addisons: "Hypoadrenocorticism (Addison's)",
  hypoadrenocorticism: "Hypoadrenocorticism (Addison's)",
  dmtype1: "Diabetes mellitus",
  dmtype2: "Diabetes mellitus",
  diabetesmellitus: "Diabetes mellitus",
  osteoarthritis: "Osteoarthritis",
  oa: "Osteoarthritis",
  degenerativejointdisease: "Osteoarthritis",
  djd: "Osteoarthritis",
  hip: "Hip dysplasia",
  hipdysplasia: "Hip dysplasia",
  lymphoma: "Lymphoma",
  lymphosarcoma: "Lymphoma",
  mct: "Mast cell tumor",
  mastcelltumor: "Mast cell tumor",
};

function normalizeKeyForDedup(input: string) {
  const lower = input.toLowerCase().trim();
  const compact = lower.replace(/&/g, "and").replace(/\s+/g, " ");
  const stripped = compact.replace(/[^a-z0-9]+/g, "");
  if (stripped === "cushingsdisease" || stripped === "cushingssyndrome") return "hyperadrenocorticism";
  if (stripped === "addisonsdisease") return "hypoadrenocorticism";
  if (stripped === "gdv") return "bloat";
  return stripped;
}

function canonicalizeDiagnosisDisplay(raw: string) {
  const key = normalizeKeyForDedup(raw);
  return CANONICAL_DIAGNOSIS_MAP[key] || raw;
}

function normalizeSystem(system?: string) {
  if (!system) return "";
  return system
    .toLowerCase()
    .trim()
    .replace(/\//g, "_")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

function displaySystemLabel(system?: string) {
  const s = normalizeSystem(system);
  if (!s) return "";
  return s
    .split("_")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function filterCasesBySystems(pool: Case[], selectedSystems: Set<string>) {
  const base =
    selectedSystems.size === 0
      ? pool
      : pool.filter((c) => c.system && selectedSystems.has(normalizeSystem(c.system)));
  return dedupeCasesById(base);
}

// =============================================================
// NAVLE DIAGNOSIS BANK (makes dropdown harder)
// =============================================================

const NAVLE_DIAGNOSIS_BANK: string[] = [
  // Canine
  "Parvovirus infection",
  "Canine distemper",
  "Infectious canine hepatitis",
  "Canine influenza",
  "Kennel cough (CIRD)",
  "Leptospirosis",
  "Heartworm disease",
  "Bloat (GDV)",
  "Idiopathic epilepsy",
  "Intervertebral disc disease (IVDD)",
  "Hip dysplasia",
  "Cruciate ligament rupture",
  "Osteosarcoma",
  "Lymphoma",
  "Mast cell tumor",
  "Hemangiosarcoma",
  "Hyperadrenocorticism (Cushing's)",
  "Hypoadrenocorticism (Addison's)",
  "Hypothyroidism",
  "Diabetes mellitus",
  "Dilated cardiomyopathy",
  "Mitral valve disease",
  "Degenerative myelopathy",
  "Immune-mediated hemolytic anemia (IMHA)",
  "Immune-mediated thrombocytopenia (ITP)",
  "Pancreatitis",
  "Exocrine pancreatic insufficiency (EPI)",
  "Portosystemic shunt",
  "Urolithiasis",
  "Pyometra",
  "Prostatic hyperplasia",
  "Atopic dermatitis",
  "Demodicosis",
  "Sarcoptic mange",
  "Otitis externa",
  "Conjunctivitis",
  "Corneal ulcer",
  "Glaucoma",
  // Feline
  "Feline infectious peritonitis (FIP)",
  "Feline leukemia virus (FeLV)",
  "Feline immunodeficiency virus (FIV)",
  "Feline herpesvirus (FHV-1)",
  "Feline calicivirus (FCV)",
  "Feline panleukopenia",
  "Hyperthyroidism",
  "Chronic kidney disease",
  "Lower urinary tract disease (FLUTD)",
  "Feline asthma",
  "Hypertrophic cardiomyopathy (HCM)",
  "Hepatic lipidosis",
  "Cholangiohepatitis",
  "Feline injection site sarcoma",
  "Diabetes mellitus",
  "Hyperthyroidism",
  "Toxoplasmosis",
  "Ringworm (dermatophytosis)",
  // Equine
  "Colic (equine)",
  "Strangles",
  "Equine influenza",
  "Equine herpesvirus (EHV)",
  "West Nile virus encephalitis",
  "Equine encephalomyelitis",
  "Tetanus",
  "Rabies",
  "Navicular disease",
  "Laminitis",
  "Heaves (equine asthma)",
  "Choke (esophageal obstruction)",
  "Equine gastric ulcer syndrome (EGUS)",
  "Pigeon fever",
  "Rain rot (dermatophilosis)",
  "Ringworm (equine)",
  "Equine metabolic syndrome (EMS)",
  "Pituitary pars intermedia dysfunction (PPID)",
  // Bovine
  "Bovine respiratory disease (BRD)",
  "Bovine viral diarrhea (BVD)",
  "Infectious bovine rhinotracheitis (IBR)",
  "Bovine coronavirus",
  "Foot-and-mouth disease",
  "Brucellosis",
  "Tuberculosis (bovine)",
  "Mastitis",
  "Milk fever (hypocalcemia)",
  "Hardware disease (traumatic reticuloperitonitis)",
  "Left displaced abomasum (LDA)",
  "Right displaced abomasum (RDA)",
  "Bloat (ruminant)",
  "Pinkeye (infectious bovine keratoconjunctivitis)",
  "Ringworm (bovine)",
  "Foot rot",
  "Salmonellosis",
  "Coccidiosis",
  // Small ruminant
  "Caseous lymphadenitis (CLA)",
  "Caprine arthritis encephalitis (CAE)",
  "Maedi-visna",
  "Enterotoxemia (overeating disease)",
  "Urinary calculi (small ruminant)",
  "White muscle disease (selenium deficiency)",
  "Haemonchus contortus infection",
  // Swine
  "Porcine reproductive and respiratory syndrome (PRRS)",
  "Swine influenza",
  "Porcine circovirus disease (PCVD)",
  "Transmissible gastroenteritis (TGE)",
  "Erysipelas",
  "Mycoplasmal pneumonia",
  "Atrophic rhinitis",
  "Actinobacillus pleuropneumonia",
  "Streptococcal meningitis",
  // Avian
  "Newcastle disease",
  "Infectious bronchitis",
  "Marek's disease",
  "Avian influenza",
  "Coccidiosis (avian)",
  "Fowl cholera",
  "Aspergillosis (avian)",
  "Egg binding",
  "Psittacosis (Chlamydiosis)",
  // Exotics and general
  "Myxomatosis",
  "Rabbit hemorrhagic disease (RHD)",
  "Ferret adrenal disease",
  "Ferret insulinoma",
  "Reptile metabolic bone disease",
  "Proventricular dilatation disease",
  "Heavy metal toxicosis",
];

// =============================================================
// CASE PARSING
// =============================================================

function parseCases(text: string): Case[] {
  const blocks = text
    .split(/\n={10,}\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const cases: Case[] = [];

  for (const block of blocks) {
    const idMatch = block.match(/CASE_ID:\s*(\d+)/);
    const diagMatch = block.match(/DIAGNOSIS:\s*\n([^\n]+)/);
    const aliasMatch = block.match(/ALIASES:\s*\n([\s\S]*?)(?=\nVIGNETTE_LINES:)/);
    const clueMatch = block.match(
      /VIGNETTE_LINES:\s*\n([\s\S]*?)(?=\nTEACHING_POINTS:|\nCASE_ID:|$)/
    );
    const teachMatch = block.match(/TEACHING_POINTS:\s*\n([\s\S]*?)(?=\n={10,}|$)/);
    const difficultyMatch = block.match(/DIFFICULTY:\s*\n?([^\n]+)/);
    const systemMatch = block.match(/SYSTEM:\s*\n?([^\n]+)/);

    if (!idMatch || !diagMatch || !clueMatch) continue;

    const diagnosis = diagMatch[1].trim();
    const aliases = aliasMatch
      ? aliasMatch[1]
          .split("\n")
          .map((a) => a.replace(/^[-\s]+/, "").trim())
          .filter(Boolean)
      : [];
    const clues = clueMatch[1]
      .split("\n")
      .map((line) => line.replace(/^\d+\.\s*/, "").replace(/^[-\s]+/, "").trim())
      .filter(Boolean);
    const teachingPoints = teachMatch
      ? teachMatch[1]
          .split("\n")
          .map((line) => line.replace(/^[*\-]\s*/, "").trim())
          .filter(Boolean)
      : [];

    cases.push({
      id: idMatch[1],
      diagnosis,
      aliases,
      clues,
      teachingPoints,
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#d97706", "#22c55e", "#86efac", "#facc15", "#f97316", "#ffffff", "#a78bfa"];
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
        <button onClick={copyShareText} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: theme.accent }}>{copied ? "Copied" : "Copy"}</button>
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
    const green = Math.max(1, Math.min(solvedAtClueCount, MAX_GUESSES));
    const white = Math.max(0, MAX_GUESSES - green);
    return `VETTLE\nSolved in ${green} clue${green === 1 ? "" : "s"}\n${"🟧".repeat(green)}${"⬜".repeat(white)}`;
  }, [won, solvedAtClueCount]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div className="w-full max-w-lg rounded-2xl p-7 text-center shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: won ? theme.modalWin : theme.modalLose, border: `1px solid ${won ? theme.modalBorderWin : theme.modalBorderLose}` }}>
        {won ? (
          <>
            <p className="text-2xl font-bold mb-2" style={{ color: "#22c55e", fontFamily: "'Poppins', sans-serif" }}>Correct!</p>
            <p className="font-semibold text-xl mb-1" style={{ color: theme.text }}>{current.diagnosis}</p>
            <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
              Solved in {guesses.length} guess{guesses.length !== 1 ? "es" : ""} · clue {solvedAtClueCount}
            </p>
            <ShareCard shareText={shareText} theme={theme} />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold mb-2" style={{ color: "#f43f5e", fontFamily: "'Poppins', sans-serif" }}>Out of guesses</p>
            <p className="text-sm mb-1" style={{ color: theme.textMuted }}>The diagnosis was:</p>
            <p className="text-xl font-bold mb-4" style={{ color: theme.text }}>{current.diagnosis}</p>
          </>
        )}
        {current.teachingPoints.length > 0 && (
          <div className="mb-4">
            <button onClick={() => setShowTeaching((s) => !s)} className="text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: theme.bgCard, color: theme.accent, border: `1px solid ${theme.accent}` }}>
              {showTeaching ? "Hide" : "Show"} teaching points
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
            <button onClick={onArchive} className="flex-1 py-3 rounded-lg font-semibold text-sm text-white" style={{ background: theme.accent }}>Play archive</button>
            <button onClick={onRandom} className="flex-1 py-3 rounded-lg font-semibold text-sm" style={{ background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` }}>Endless mode</button>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <button onClick={onArchive} className="flex-1 py-3 rounded-lg font-semibold text-sm text-white" style={{ background: theme.accent }}>Archive</button>
            <button onClick={onRandom} className="flex-1 py-3 rounded-lg font-semibold text-sm" style={{ background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` }}>Endless</button>
            <button onClick={onBackToDaily} className="flex-1 py-3 rounded-lg font-semibold text-sm" style={{ background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` }}>Today</button>
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
  const [lightMode, setLightMode] = useState(false);
  const theme: Theme = lightMode ? LIGHT_THEME : DARK_THEME;
  const [solvedAtClueCount, setSolvedAtClueCount] = useState(1);
  const [loadError, setLoadError] = useState("");
  const [dailyCaseId, setDailyCaseId] = useState<number>(0);
  const [caseMode, setCaseMode] = useState<"daily" | "archive" | "random">("daily");
  const [showSystemFilter, setShowSystemFilter] = useState(false);
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(new Set());

  const resetRound = useCallback((nextCase: Case) => {
    setCurrent(nextCase);
    setSelectedCaseId(nextCase.id);
    setRevealed(1);
    setGuess("");
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    setShowDropdown(false);
    setShowConfetti(false);
    setSolvedAtClueCount(1);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadCases() {
      try {
        const r = await fetch(DAILY_CASES_FILE);
        if (!r.ok) throw new Error(`Failed to load cases from ${DAILY_CASES_FILE}`);
        const parsed = dedupeCasesById(parseCases(await r.text()));
        if (!active) return;
        setCases(parsed);
        if (parsed.length === 0) { setLoadError("No cases were parsed from any file."); return; }
        const sequentialId = getSequentialDailyCaseId();
        const playableId = getPlayableDailyCaseId(sequentialId, parsed);
        setDailyCaseId(sequentialId);
        const daily = findCaseByNumericId(parsed, playableId) ?? parsed[parsed.length - 1];
        setCurrent(daily);
        setSelectedCaseId(daily.id);
        setSeenIds(new Set([daily.id]));
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
        const res = await fetch(ENDLESS_CASES_FILE);
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
    [...cases, ...randomCases].forEach((c) => {
      if (c.system) set.add(normalizeSystem(c.system));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cases, randomCases]);

  const eligibleCases = useMemo(
    () => filterCasesBySystems(cases, selectedSystems),
    [cases, selectedSystems]
  );

  const eligibleRandomCases = useMemo(
    () => filterCasesBySystems(randomCases, selectedSystems),
    [randomCases, selectedSystems]
  );

  const toggleSystem = useCallback((system: string) => {
    setSelectedSystems((prev) => {
      const next = new Set(prev);
      const key = normalizeSystem(system);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!current || selectedSystems.size === 0) return;

    const curSys = normalizeSystem(current.system);
    if (curSys && selectedSystems.has(curSys)) return;

    const pool = caseMode === "random" ? eligibleRandomCases : eligibleCases;
    if (!pool.length) return;

    const next = pool[Math.floor(Math.random() * pool.length)];
    setSeenIds(new Set([next.id]));
    resetRound(next);
  }, [current, eligibleCases, eligibleRandomCases, selectedSystems, caseMode, resetRound]);

  const loadCaseById = useCallback((caseId: string) => {
    if (!eligibleCases.length) return;
    const nextCase = eligibleCases.find((c) => c.id === caseId);
    if (!nextCase) return;
    setSeenIds(new Set([nextCase.id]));
    resetRound(nextCase);
  }, [eligibleCases, resetRound]);

  const startArchiveCase = useCallback(() => {
    const pool = eligibleCases.filter((c) => {
      const id = Number(c.id);
      return id >= ARCHIVE_START && id < dailyCaseId;
    });
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setCaseMode("archive");
    setSeenIds(new Set([next.id]));
    resetRound(next);
  }, [eligibleCases, dailyCaseId, resetRound]);

  const startRandomCase = useCallback(() => {
    if (!eligibleRandomCases.length) return;
    const next = eligibleRandomCases[Math.floor(Math.random() * eligibleRandomCases.length)];
    setCaseMode("random");
    setSeenIds(new Set([next.id]));
    resetRound(next);
  }, [eligibleRandomCases, resetRound]);

  const startDailyCase = useCallback(() => {
    const playableId = getPlayableDailyCaseId(dailyCaseId, eligibleCases);
    const daily = findCaseByNumericId(eligibleCases, playableId);
    if (!daily) return;
    setCaseMode("daily");
    setSeenIds(new Set([daily.id]));
    resetRound(daily);
  }, [eligibleCases, dailyCaseId, resetRound]);

  const allDiagnoses = useMemo(() => {
    const casePool =
      caseMode === "random"
        ? dedupeCasesById([...eligibleCases, ...eligibleRandomCases])
        : eligibleCases;
    const fromCases = casePool.flatMap((c) => [c.diagnosis, ...c.aliases]);
    const combined = [...NAVLE_DIAGNOSIS_BANK, ...fromCases];
    const map = new Map<string, string>();
    for (const item of combined) {
      const canonical = canonicalizeDiagnosisDisplay(item);
      const key = normalizeKeyForDedup(canonical);
      const prev = map.get(key);
      if (!prev || canonical.length > prev.length) map.set(key, canonical);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [eligibleCases, eligibleRandomCases, caseMode]);

  const caseOptions = useMemo(() => {
    const maxPublished = getMaxCaseId(eligibleCases);
    const playableId = getPlayableDailyCaseId(dailyCaseId, eligibleCases);
    const maxAllowed = Math.min(dailyCaseId > 0 ? dailyCaseId : 0, maxPublished);
    const options = eligibleCases
      .filter((c) => {
        const id = Number(c.id);
        return id >= ARCHIVE_START && id <= maxAllowed;
      })
      .map((c) => {
        const id = Number(c.id);
        const isToday = id === playableId;
        const datePart = isToday ? " — Today" : ` — ${getDateForCaseId(id)}`;
        return { id: c.id, label: `Case ${id}${datePart}` };
      });
    if (caseMode === "random") return [{ id: "__endless__", label: "Endless mode" }, ...options];
    return options;
  }, [eligibleCases, dailyCaseId, caseMode]);

  const filtered = useMemo(() => {
    const q = guess.trim().toLowerCase();
    if (!q) return [];
    const qKey = normalizeKeyForDedup(q);
    return allDiagnoses.filter((d) => {
      if (d.toLowerCase().includes(q)) return true;
      return normalizeKeyForDedup(d).includes(qKey);
    }).slice(0, 10);
  }, [allDiagnoses, guess]);

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
    setGuesses(newGuesses);
    setGuess("");
    setShowDropdown(false);
    if (correct) { setWon(true); setGameOver(true); setShowConfetti(true); setSolvedAtClueCount(revealed); return; }
    setRevealed((prev) => Math.min(prev + 1, current.clues.length));
    if (newGuesses.length >= MAX_GUESSES) setGameOver(true);
  }, [current, gameOver, guesses, revealed]);

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg, color: theme.text }}>
        <div className="max-w-xl rounded-lg p-6 border" style={{ background: theme.bgCard, borderColor: theme.border }}>
          <p className="text-lg font-semibold mb-2">Could not load the cases file.</p>
          <p className="text-sm" style={{ color: theme.textMuted }}>{loadError}</p>
          <p className="text-sm mt-3" style={{ color: theme.textMuted }}>
            Put daily cases in <span className="font-mono">public/vettle cases/cases_vettle_navle.txt</span> and endless cases in <span className="font-mono">vettle_random_cases.txt</span>.
          </p>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: theme.bg, color: theme.text }}>
        <p className="text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen flex flex-col items-center px-4 py-8 transition-colors duration-300"
      style={{ background: theme.bg, color: theme.text }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
      {showConfetti && <Confetti />}
      <Analytics />

      {gameOver && current && (
        <ResultModal
          won={won}
          current={current}
          guesses={guesses}
          solvedAtClueCount={solvedAtClueCount}
          onArchive={startArchiveCase}
          onRandom={startRandomCase}
          onBackToDaily={startDailyCase}
          caseMode={caseMode}
          theme={theme}
        />
      )}

      <div className="relative z-10 w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>Vettle</h1>
            <a
              href="https://www.medicle.net/vettle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium hover:underline"
              style={{ color: theme.accent }}
            >
              www.medicle.net/vettle
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLightMode((v) => !v)}
              className="text-xs rounded-lg px-2.5 py-1.5 font-medium"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textMuted }}
            >
              {lightMode ? "Dark" : "Light"}
            </button>
            <select
              onChange={(e) => {
                if (e.target.value === "medicle") window.location.href = "/";
                if (e.target.value === "vettle") window.location.href = "/vettle";
                if (e.target.value === "psychodle") window.location.href = "/psychodle";
                if (e.target.value === "dentdle") window.location.href = "/dentdle";
                if (e.target.value === "crimindle") window.location.href = "/crimindle";
              }}
              defaultValue="vettle"
              className="text-xs rounded-lg px-2 py-1.5 outline-none"
              style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text }}
            >
              <option value="medicle">Medicle</option>
              <option value="vettle">Vettle</option>
              <option value="psychodle">Psychodle</option>
              <option value="dentdle">Dentdle</option>
              <option value="crimindle">Crimindle</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={startDailyCase}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{
              background: caseMode === "daily" ? theme.accent : theme.bgCard,
              color: caseMode === "daily" ? "#fff" : theme.text,
              border: `1px solid ${caseMode === "daily" ? theme.accent : theme.border}`,
            }}
          >
            Today&apos;s case
          </button>
          <button
            onClick={startRandomCase}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{
              background: caseMode === "random" ? theme.accent : theme.bgCard,
              color: caseMode === "random" ? "#fff" : theme.text,
              border: `1px solid ${caseMode === "random" ? theme.accent : theme.border}`,
            }}
          >
            Endless mode
          </button>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={caseMode === "random" ? "__endless__" : selectedCaseId}
              onChange={(e) => {
                if (e.target.value === "__endless__") {
                  startRandomCase();
                  return;
                }
                const num = Number(e.target.value);
                if (num === getPlayableDailyCaseId(dailyCaseId, eligibleCases)) startDailyCase();
                else {
                  setCaseMode("archive");
                  loadCaseById(e.target.value);
                }
              }}
              className="flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: theme.selectBg, border: `1px solid ${theme.border}`, color: theme.text }}
              disabled={!eligibleCases.length}
            >
              {caseOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowSystemFilter((s) => !s)}
              className="text-xs rounded-lg px-2.5 py-2 font-medium shrink-0"
              style={{
                background: showSystemFilter ? theme.bgCard : "transparent",
                border: `1px solid ${theme.border}`,
                color: selectedSystems.size > 0 ? theme.accent : theme.textMuted,
              }}
            >
              Filter body systems{selectedSystems.size > 0 ? ` (${selectedSystems.size})` : ""}
            </button>
          </div>

          {showSystemFilter && (
            <div
              className="mt-2 rounded-lg p-3 border"
              style={{ background: theme.bgCard, borderColor: theme.border }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
                  Body system (optional)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSystems(new Set())}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg"
                    style={{ background: theme.border, color: theme.text }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSystems(new Set(allSystems))}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg text-white"
                    style={{ background: theme.accent }}
                  >
                    Select all
                  </button>
                </div>
              </div>

              {allSystems.length === 0 ? (
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  No body-system tags were found in your cases files.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allSystems.map((sys) => (
                    <label
                      key={sys}
                      className="flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none"
                      style={{
                        background: selectedSystems.has(sys) ? `${theme.accent}22` : "transparent",
                        borderColor: selectedSystems.has(sys) ? theme.accent : theme.border,
                        color: selectedSystems.has(sys) ? theme.text : theme.textMuted,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSystems.has(sys)}
                        onChange={() => toggleSystem(sys)}
                        style={{ accentColor: theme.accent }}
                      />
                      <span>{displaySystemLabel(sys)}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedSystems.size > 0 && (
                <p className="text-xs mt-3" style={{ color: theme.textFaint }}>
                  Active: {Array.from(selectedSystems).map(displaySystemLabel).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold mb-4 pb-3 border-b" style={{ borderColor: theme.border, fontFamily: "'Poppins', sans-serif" }}>
          What&apos;s the diagnosis?
        </h2>

        <div className="mb-6">
          {current.clues.slice(0, revealed).map((clue, i) => (
            <div key={i}>
              {i > 0 && <div className="my-3 border-t" style={{ borderColor: theme.border }} />}
              <p className="text-sm leading-relaxed" style={{ color: theme.text }}>
                {clue}
              </p>
            </div>
          ))}
        </div>

        {!gameOver && (
          <div className="relative mb-4">
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg px-3 py-2 outline-none text-sm"
                style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.text }}
                placeholder="Enter diagnosis..."
                value={guess}
                onChange={(e) => { setGuess(e.target.value); setShowDropdown(true); }}
                onKeyDown={(e) => e.key === "Enter" && submitGuess(guess)}
                onFocus={() => setShowDropdown(true)}
              />
              <button
                onClick={() => submitGuess(guess)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white shrink-0"
                style={{ background: theme.accent }}
              >
                Submit
              </button>
            </div>

            {showDropdown && filtered.length > 0 && (
              <div
                className="absolute z-10 w-full rounded-lg mt-1 overflow-hidden border"
                style={{ background: theme.bgCard, borderColor: theme.border }}
              >
                {filtered.map((d, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 cursor-pointer text-sm hover:opacity-80"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : undefined, color: theme.text }}
                    onMouseDown={() => submitGuess(d)}
                  >
                    {d}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
          {guessesLeft} guess{guessesLeft !== 1 ? "es" : ""} remaining · clue {revealed} of {Math.min(current.clues.length, MAX_GUESSES)}
        </p>

        {guesses.length > 0 && (
          <div className="space-y-1 mb-8">
            {guesses.map((g, i) => (
              <p key={i} className="text-sm" style={{ color: g.correct ? "#22c55e" : g.skipped ? theme.textMuted : "#f87171" }}>
                {g.skipped ? "Skipped" : g.text}
              </p>
            ))}
          </div>
        )}

        <p className="text-xs text-center" style={{ color: theme.textFaint }}>
          Inspired by{" "}
          <a href="https://doctordle.org" target="_blank" rel="noopener noreferrer" style={{ color: theme.accent }}>
            Doctordle
          </a>
          . For educational use only.
        </p>
      </div>
    </main>
  );
}
