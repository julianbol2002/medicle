"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

// =============================================================
// THEME TOKENS
// =============================================================

const DARK_THEME = {
  bg:             "#1a1a1a",
  bgCard:         "#262626",
  bgInput:        "#262626",
  border:         "#404040",
  text:           "#f5f5f5",
  textMuted:      "#a3a3a3",
  textFaint:      "#737373",
  accent:         "#14b8a6",
  decor:          "#14b8a6",
  selectBg:       "#262626",
  modalWin:       "#1f2937",
  modalLose:      "#2d0a0a",
  modalBorderWin: "#22c55e",
  modalBorderLose:"#dc2626",
  shareCard:      "#262626",
  teachPanel:     "#1f2937",
};

const LIGHT_THEME = {
  bg:             "#f4f7f8",
  bgCard:         "#ffffff",
  bgInput:        "#ffffff",
  border:         "#d1dde3",
  text:           "#1a2e35",
  textMuted:      "#5c6f78",
  textFaint:      "#8fa3ad",
  accent:         "#0d9488",
  decor:          "#0d9488",
  selectBg:       "#ffffff",
  modalWin:       "#ecfdf5",
  modalLose:      "#fff1f2",
  modalBorderWin: "#22c55e",
  modalBorderLose:"#dc2626",
  shareCard:      "#f8fafc",
  teachPanel:     "#f1f5f9",
};

type Theme = typeof DARK_THEME;

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
// Daily cases: medicle cases daily.txt — case 001 on launch day, +1 per day
// Endless mode: medicle cases endless mode.txt — separate pool, same ID format
// Add cases to each file progressively; the app uses whatever is loaded.
// =============================================================

const DAILY_ANCHOR_DATE = new Date("2026-06-10T00:00:00"); // case 001 goes live
const DAILY_ANCHOR_CASE_ID = 1;

const DAILY_CASES_FILE = "/doctordle cases/medicle cases daily.txt";
const ENDLESS_CASES_FILE = "/doctordle cases/medicle cases endless mode.txt";

function getDailyOffset(): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const anchor = new Date(
    DAILY_ANCHOR_DATE.getFullYear(),
    DAILY_ANCHOR_DATE.getMonth(),
    DAILY_ANCHOR_DATE.getDate()
  );
  const diffMs = today.getTime() - anchor.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Calendar slot for today (case 1 on launch day, case 2 the next day, etc.)
function getSequentialDailyCaseId(): number {
  return DAILY_ANCHOR_CASE_ID + getDailyOffset();
}

function getMaxCaseId(caseList: Case[]): number {
  if (!caseList.length) return 0;
  return Math.max(...caseList.map((c) => Number(c.id)));
}

// If today's slot exceeds published cases, play the latest available case
function getPlayableDailyCaseId(sequentialId: number, caseList: Case[]): number {
  const maxId = getMaxCaseId(caseList);
  if (!maxId) return 1;
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

// ✅ Optional: add a much larger Step 1 answer bank in /public
// Format: one diagnosis per line.
// This makes the dropdown harder (more realistic).
const DIAGNOSIS_BANK_PATH = "/step1_diagnosis_bank.txt";

// =============================================================
// NORMALIZATION HELPERS
// =============================================================

function normalizeAnswer(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

// ---------------------------------------------
// ✅ Canonicalization for dropdown + matching
// - Fix duplicates: DVT vs Deep vein thrombosis
// - Fix spelling variations: Crohn disease vs Crohn's disease
// - Keep permissive matching, but dropdown suggestions are clean
// ---------------------------------------------

// Add as many mappings as you want over time.
// Keys MUST be normalizedKeyForDedup(...)
const CANONICAL_DIAGNOSIS_MAP: Record<string, string> = {
  // Vascular
  dvt: "Deep vein thrombosis (DVT)",
  deepveinthrombosis: "Deep vein thrombosis (DVT)",
  deepvenousthrombosis: "Deep vein thrombosis (DVT)",

  pe: "Pulmonary embolism (PE)",
  pulmonaryembolism: "Pulmonary embolism (PE)",

  // Cardio
  mi: "Myocardial infarction (MI)",
  myocardialinfarction: "Myocardial infarction (MI)",

  af: "Atrial fibrillation (AF)",
  afib: "Atrial fibrillation (AF)",
  atrialfibrillation: "Atrial fibrillation (AF)",

  // GI
  crohndisease: "Crohn disease",
  crohnsdisease: "Crohn disease",
  chrondisease: "Crohn disease", // common misspelling
  "chronsdisease": "Crohn disease",

  ulcerativecolitis: "Ulcerative colitis",

  // Renal
  ckd: "Chronic kidney disease (CKD)",
  chronickidneydisease: "Chronic kidney disease (CKD)",

  // Pulm
  copd: "Chronic obstructive pulmonary disease (COPD)",
  chronicobstructivepulmonarydisease: "Chronic obstructive pulmonary disease (COPD)",

  // Infectious
  uti: "Urinary tract infection (UTI)",
  urinarytractinfection: "Urinary tract infection (UTI)",

  // Neuro
  alzheimerdisease: "Alzheimer disease",
  alzheimersdisease: "Alzheimer disease",

  // Heme/Onc
  hodgkinlymphoma: "Hodgkin lymphoma",
  hodgkinslymphoma: "Hodgkin lymphoma",
};

function normalizeKeyForDedup(input: string) {
  const lower = input.toLowerCase().trim();

  // Normalize separators
  const compact = lower.replace(/&/g, "and").replace(/\s+/g, " ");

  // Remove punctuation → compact key
  const stripped = compact.replace(/[^a-z0-9]+/g, "");

  // VERY targeted merges for common possessive disease names
  if (stripped === "crohnsdisease") return "crohndisease";
  if (stripped === "hodgkinslymphoma") return "hodgkinlymphoma";
  if (stripped === "alzheimersdisease") return "alzheimerdisease";

  return stripped;
}

function canonicalizeDiagnosisDisplay(raw: string) {
  const key = normalizeKeyForDedup(raw);
  return CANONICAL_DIAGNOSIS_MAP[key] || raw;
}

// ✅ Canonicalize system strings so we never have duplicates like:
// "infectious disease" vs "infectious_disease" vs "infectious-disease"
function normalizeSystem(system?: string) {
  if (!system) return "";
  return system
    .toLowerCase()
    .trim()
    .replace(/\//g, "_")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

// =============================================================
// STEP 1 BANK (built-in fallback)
// =============================================================

// ✅ This makes the dropdown HARDER because choices aren't limited to your case answers.
// You can remove items or expand freely. Each item should be the *canonical display*.
// If you add DIAGNOSIS_BANK_PATH in /public, that will merge on top.
const DEFAULT_STEP1_DIAGNOSIS_BANK: string[] = [
  // Cardio
  "Acute pericarditis",
  "Aortic dissection",
  "Aortic stenosis",
  "Atrial fibrillation (AF)",
  "Atrial flutter",
  "Cardiac tamponade",
  "Cardiogenic shock",
  "Dilated cardiomyopathy",
  "Hypertrophic cardiomyopathy",
  "Infective endocarditis",
  "Mitral regurgitation",
  "Mitral stenosis",
  "Myocardial infarction (MI)",
  "Pericardial effusion",
  "Stable angina",
  "Unstable angina",
  "Ventricular fibrillation",
  "Ventricular tachycardia",

  // Pulm
  "Acute respiratory distress syndrome (ARDS)",
  "Asthma",
  "Chronic obstructive pulmonary disease (COPD)",
  "Community-acquired pneumonia",
  "Legionella pneumonia",
  "Mycoplasma pneumonia",
  "Pleural effusion",
  "Pneumothorax",
  "Pulmonary embolism (PE)",
  "Pulmonary hypertension",

  // GI
  "Acute pancreatitis",
  "Achalasia",
  "Appendicitis",
  "Celiac disease",
  "Cholecystitis",
  "Cholelithiasis",
  "Cirrhosis",
  "Crohn disease",
  "Diverticulitis",
  "Esophageal varices",
  "Gastroesophageal reflux disease (GERD)",
  "Gastric ulcer",
  "Gilbert syndrome",
  "Hepatitis A",
  "Hepatitis B",
  "Hepatitis C",
  "Mallory-Weiss tear",
  "Peptic ulcer disease (PUD)",
  "Ulcerative colitis",

  // Endo
  "Addison disease",
  "Cushing syndrome",
  "Diabetes insipidus",
  "Diabetes mellitus type 1",
  "Diabetes mellitus type 2",
  "Graves disease",
  "Hashimoto thyroiditis",
  "Hyperaldosteronism (Conn syndrome)",
  "Hyperprolactinemia",
  "Hypothyroidism",
  "Pheochromocytoma",
  "Thyroid storm",

  // Neuro
  "Alzheimer disease",
  "Brain abscess",
  "Cluster headache",
  "Epilepsy",
  "Guillain-Barré syndrome",
  "Ischemic stroke",
  "Migraine",
  "Multiple sclerosis",
  "Parkinson disease",
  "Subdural hematoma",

  // Infectious
  "Chlamydia infection",
  "Cytomegalovirus (CMV) infection",
  "Diphtheria",
  "Gonorrhea",
  "Influenza",
  "Listeriosis",
  "Measles",
  "Syphilis",
  "Tetanus",
  "Toxoplasmosis",
  "Urinary tract infection (UTI)",
  "Varicella",
  "Herpes zoster",

  // Heme/Onc
  "Aplastic anemia",
  "Anemia of chronic disease",
  "Beta-thalassemia",
  "Disseminated intravascular coagulation (DIC)",
  "Factor V Leiden",
  "Folate deficiency",
  "G6PD deficiency",
  "Hemophilia A",
  "Iron deficiency anemia",
  "Polycythemia vera",
  "Sideroblastic anemia",
  "Tumor lysis syndrome",

  // Renal
  "Acute interstitial nephritis",
  "Acute kidney injury",
  "Chronic kidney disease (CKD)",
  "Nephritic syndrome",
  "Nephrotic syndrome",
  "Pyelonephritis",

  // Derm
  "Basal cell carcinoma",
  "Contact dermatitis",
  "Impetigo",
  "Psoriasis",
  "Tinea corporis",
  "Vitiligo",

  // Peds
  "Bronchiolitis",
  "Croup",
  "Hand-foot-and-mouth disease",
  "Intussusception",
  "Rotavirus infection",
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
      /VIGNETTE_LINES:\s*\n([\s\S]*?)(?=\nTEACHING_POINTS:\nCASE_ID:|\n={10,}|$)/
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

// =============================================================
// CASE DEDUPLICATION (prevents duplicate case IDs showing twice)
// =============================================================

function dedupeCasesById(list: Case[]): Case[] {
  // If the same CASE_ID appears more than once (e.g., included in multiple files),
  // keep the most information-rich version.
  const map = new Map<string, Case>();

  for (const c of list) {
    const prev = map.get(c.id);
    if (!prev) {
      map.set(c.id, c);
      continue;
    }

    // Prefer the case with more clues, then more teaching points, then longer diagnosis string.
    const prevScore = (prev.clues?.length || 0) * 1000 + (prev.teachingPoints?.length || 0) * 10 + (prev.diagnosis?.length || 0);
    const curScore = (c.clues?.length || 0) * 1000 + (c.teachingPoints?.length || 0) * 10 + (c.diagnosis?.length || 0);

    if (curScore > prevScore) {
      map.set(c.id, c);
    }
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

    const colors = ["#14b8a6", "#22c55e", "#86efac", "#0d9488", "#5eead4", "#ffffff"];

    const pieces = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 7 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      tiltAngle: Math.random() * Math.PI * 2,
      tiltSpeed: Math.random() * 0.07 + 0.03,
      speed: Math.random() * 2.5 + 1.5,
    }));

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.tiltAngle += p.tiltSpeed;
        p.y += p.speed;
        const tilt = Math.sin(p.tiltAngle) * 14;
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + tilt, p.y + tilt + p.r / 2);
        ctx.stroke();
        if (p.y > canvas.height) p.y = -10;
      });
      animId = requestAnimationFrame(draw);
    };

    draw();
    const stop = setTimeout(() => cancelAnimationFrame(animId), 5000);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(stop);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// =============================================================
// SHARE + RESULT MODAL
// =============================================================

function ShareCard({ shareText, theme }: { shareText: string; theme: Theme }) {
  const [copied, setCopied] = useState(false);

  const copyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-4 rounded-2xl p-4 text-left" style={{ background: theme.shareCard, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
          Share result
        </p>
        <button
          onClick={copyShareText}
          className="text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: theme.accent, color: "#ffffff" }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-6 font-mono" style={{ color: theme.text }}>
        {shareText}
      </pre>
    </div>
  );
}

function ResultModal({
  won,
  current,
  guesses,
  solvedAtClueCount,
  onRandom,
  onArchive,
  onBackToDaily,
  caseMode,
  theme,
}: {
  won: boolean;
  current: Case;
  guesses: Guess[];
  solvedAtClueCount: number;
  onRandom: () => void;
  onArchive: () => void;
  onBackToDaily: () => void;
  caseMode: "daily" | "archive" | "random";
  theme: Theme;
}) {
  const [showTeaching, setShowTeaching] = useState(false);

  const shareText = useMemo(() => {
    if (!won) return "";
    const green = Math.max(1, Math.min(solvedAtClueCount, MAX_GUESSES));
    const white = Math.max(0, MAX_GUESSES - green);
    return `MEDICLE\nSolved in ${green} clue${green === 1 ? "" : "s"}\n${"🟩".repeat(green)}${"⬜".repeat(white)}`;
  }, [won, solvedAtClueCount]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div
        className="w-full max-w-lg rounded-2xl p-7 text-center shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: won ? theme.modalWin : theme.modalLose, border: `1px solid ${won ? theme.modalBorderWin : theme.modalBorderLose}` }}
      >
        {won ? (
          <>
            <p className="text-2xl font-bold mb-2" style={{ color: "#22c55e" }}>
              Correct!
            </p>
            <p className="font-semibold text-xl mb-1" style={{ color: theme.text }}>{current.diagnosis}</p>
            <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
              Solved in {guesses.length} guess{guesses.length !== 1 ? "es" : ""} · clue {solvedAtClueCount}
            </p>
            <ShareCard shareText={shareText} theme={theme} />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold mb-2" style={{ color: "#f43f5e" }}>
              Out of guesses
            </p>
            <p className="text-sm mb-1" style={{ color: theme.textMuted }}>The diagnosis was:</p>
            <p className="text-xl font-bold mb-4" style={{ color: theme.text }}>{current.diagnosis}</p>
          </>
        )}

        {current.teachingPoints.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowTeaching((s) => !s)}
              className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: theme.bgCard, color: theme.accent, border: `1px solid ${theme.accent}` }}
            >
              {showTeaching ? "Hide" : "Show"} teaching points
            </button>
            {showTeaching && (
              <div className="mt-3 rounded-xl p-4 text-left space-y-2" style={{ background: theme.teachPanel }}>
                {current.teachingPoints.map((pt, i) => (
                  <p key={i} className="text-sm" style={{ color: theme.textMuted }}>
                    <span style={{ color: theme.accent }}>•</span> {pt}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buttons change based on which mode the player is in */}
        {caseMode === "daily" ? (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <button onClick={onArchive} className="flex-1 py-3 rounded-lg font-semibold text-sm text-white" style={{ background: theme.accent }}>
                Play archive
              </button>
              <button onClick={onRandom} className="flex-1 py-3 rounded-lg font-semibold text-sm" style={{ background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` }}>
                Endless mode
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2">
              <button onClick={onArchive} className="flex-1 py-3 rounded-lg font-semibold text-sm text-white" style={{ background: theme.accent }}>
                Archive
              </button>
              <button onClick={onRandom} className="flex-1 py-3 rounded-lg font-semibold text-sm" style={{ background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` }}>
                Endless
              </button>
              <button onClick={onBackToDaily} className="flex-1 py-3 rounded-lg font-semibold text-sm" style={{ background: theme.bgCard, color: theme.text, border: `1px solid ${theme.border}` }}>
                Today
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================
// MEDICAL DECOR (minimal line SVGs)
// =============================================================

function StethoscopeIcon({ size = 24, color = "currentColor", opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity }}>
      <path d="M5 4v7a5 5 0 0010 0V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 4h4M12 4h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 11v2a3 3 0 01-3 3h-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17.5" cy="17.5" r="2.5" stroke={color} strokeWidth="1.5" />
      <path d="M15 13h1.5a3.5 3.5 0 013.5 3.5v.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BoneIcon({ size = 24, color = "currentColor", opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity }}>
      <path
        d="M7.5 9.5c-2.2 0-3.5 1.4-3.5 3s1.3 3 3.5 3c1.1 0 2-.4 2.7-1.1.7.7 1.6 1.1 2.8 1.1 2.2 0 3.5-1.4 3.5-3s-1.3-3-3.5-3c-1.2 0-2.1.4-2.8 1.1-.7-.7-1.6-1.1-2.7-1.1z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10.2 11.4h3.6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MedicalDecor({ theme }: { theme: Theme }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -top-2 -left-6 rotate-[-18deg]">
        <StethoscopeIcon size={120} color={theme.decor} opacity={0.07} />
      </div>
      <div className="absolute top-[38%] -right-8 rotate-[22deg]">
        <BoneIcon size={88} color={theme.decor} opacity={0.06} />
      </div>
      <div className="absolute bottom-16 -left-4 rotate-[12deg]">
        <BoneIcon size={64} color={theme.decor} opacity={0.05} />
      </div>
      <div className="absolute bottom-8 right-4 rotate-[-8deg]">
        <StethoscopeIcon size={72} color={theme.decor} opacity={0.05} />
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
  const [externalDiagnosisBank, setExternalDiagnosisBank] = useState<string[]>([]);

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

  // Daily case tracking
  const [dailyCaseId, setDailyCaseId] = useState<number>(0);
  const [caseMode, setCaseMode] = useState<"daily" | "archive" | "random">("daily");
  // =============================================================
  // LOAD CASES
  // =============================================================

  useEffect(() => {
    let active = true;

    async function loadCases() {
      try {
        const r = await fetch(DAILY_CASES_FILE);
        if (!r.ok) throw new Error(`Failed to load cases from ${DAILY_CASES_FILE}`);
        const combinedText = await r.text();
        const parsedRaw = parseCases(combinedText);
        const parsed = dedupeCasesById(parsedRaw);

        if (!active) return;

        setCases(parsed);

        if (parsed.length === 0) {
          setLoadError("No cases were parsed from any file.");
          return;
        }

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

    return () => {
      active = false;
    };
  }, []);

  // =============================================================
  // LOAD OPTIONAL STEP 1 DIAGNOSIS BANK (makes dropdown harder)
  // =============================================================

  useEffect(() => {
    let active = true;

    async function loadBank() {
      try {
        const res = await fetch(DIAGNOSIS_BANK_PATH);
        if (!res.ok) return;

        const txt = await res.text();
        const items = txt
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        if (!active) return;
        setExternalDiagnosisBank(items);
      } catch {
        // ignore
      }
    }

    loadBank();

    return () => {
      active = false;
    };
  }, []);

  // =============================================================
  // LOAD ENDLESS MODE CASES FILE
  // =============================================================

  useEffect(() => {
    let active = true;

    async function loadRandomCases() {
      try {
        const res = await fetch(ENDLESS_CASES_FILE);
        if (!res.ok) return; // silently skip if file doesn't exist yet
        const txt = await res.text();
        const parsed = dedupeCasesById(parseCases(txt));
        if (!active) return;
        setRandomCases(parsed);
      } catch {
        // ignore — endless mode file is optional until populated
      }
    }

    loadRandomCases();

    return () => {
      active = false;
    };
  }, []);

  const eligibleCases = useMemo(() => dedupeCasesById(cases), [cases]);

  // =============================================================
  // GAME ROUND UTILITIES
  // =============================================================

  const resetRound = useCallback((nextCase: Case) => {
    setCurrent(nextCase);
    setSelectedCaseId(nextCase.id);
    setRevealed(1);
    setGuess("");
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    setShowConfetti(false);
    setShowDropdown(false);
    setSolvedAtClueCount(1);
  }, []);

  const loadCaseById = useCallback(
    (caseId: string) => {
      if (!eligibleCases.length) return;
      const nextCase = eligibleCases.find((c) => c.id === caseId);
      if (!nextCase) return;
      setSeenIds(new Set([nextCase.id]));
      resetRound(nextCase);
    },
    [eligibleCases, resetRound]
  );

  // Archive: pick a random past daily case (before today)
  const startArchiveCase = useCallback(() => {
    const archivePool = eligibleCases.filter((c) => {
      const id = Number(c.id);
      return id >= DAILY_ANCHOR_CASE_ID && id < dailyCaseId;
    });
    if (!archivePool.length) return;
    const next = archivePool[Math.floor(Math.random() * archivePool.length)];
    setCaseMode("archive");
    setSeenIds(new Set([next.id]));
    resetRound(next);
  }, [eligibleCases, dailyCaseId, resetRound]);

  // Endless: pick from medicle cases endless mode.txt
  const startRandomCase = useCallback(() => {
    if (!randomCases.length) return;
    const next = randomCases[Math.floor(Math.random() * randomCases.length)];
    setCaseMode("random");
    setSeenIds(new Set([next.id]));
    resetRound(next);
  }, [randomCases, resetRound]);

  const startDailyCase = useCallback(() => {
    const playableId = getPlayableDailyCaseId(dailyCaseId, eligibleCases);
    const daily = findCaseByNumericId(eligibleCases, playableId);
    if (!daily) return;
    setCaseMode("daily");
    setSeenIds(new Set([daily.id]));
    resetRound(daily);
  }, [eligibleCases, dailyCaseId, resetRound]);

  // =============================================================
  // DROPDOWN ANSWER BANK (FIXES DUPES + EXPANDS POOL)
  // =============================================================

  const allDiagnoses = useMemo(() => {
    const casePool =
      caseMode === "random"
        ? dedupeCasesById([...eligibleCases, ...randomCases])
        : eligibleCases;
    const fromCases = casePool.flatMap((c) => [c.diagnosis, ...c.aliases]);
    const combined = [...DEFAULT_STEP1_DIAGNOSIS_BANK, ...externalDiagnosisBank, ...fromCases];

    // Canonicalize + dedupe
    const map = new Map<string, string>();

    for (const item of combined) {
      const canonical = canonicalizeDiagnosisDisplay(item);
      const key = normalizeKeyForDedup(canonical);

      // Prefer longer label if collision
      const prev = map.get(key);
      if (!prev || canonical.length > prev.length) {
        map.set(key, canonical);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [eligibleCases, randomCases, caseMode, externalDiagnosisBank]);

  const caseOptions = useMemo(() => {
    const maxPublished = getMaxCaseId(eligibleCases);
    const playableId = getPlayableDailyCaseId(dailyCaseId, eligibleCases);
    const maxAllowed = Math.min(dailyCaseId > 0 ? dailyCaseId : 0, maxPublished);
    const options = eligibleCases
      .filter((c) => {
        const id = Number(c.id);
        return id >= DAILY_ANCHOR_CASE_ID && id <= maxAllowed;
      })
      .map((c) => {
        const id = Number(c.id);
        const isToday = id === playableId;
        const datePart = isToday ? " — Today" : ` — ${getDateForCaseId(id)}`;
        return { id: c.id, label: `Case ${Number(c.id)}${datePart}` };
      });

    if (caseMode === "random") {
      return [{ id: "__endless__", label: "Endless mode" }, ...options];
    }

    return options;
  }, [eligibleCases, dailyCaseId, caseMode]);

  const filtered = useMemo(() => {
    const q = guess.trim().toLowerCase();
    if (!q) return [];

    const qKey = normalizeKeyForDedup(q);

    return allDiagnoses
      .filter((d) => {
        const dLower = d.toLowerCase();
        if (dLower.includes(q)) return true;
        const dKey = normalizeKeyForDedup(d);
        return dKey.includes(qKey);
      })
      .slice(0, 10);
  }, [allDiagnoses, guess]);

  const guessesLeft = MAX_GUESSES - guesses.length;

  // =============================================================
  // SUBMIT GUESS (FIX: canonical equivalence)
  // =============================================================

  const submitGuess = useCallback(
    (text: string, skipped = false) => {
      if (!current || gameOver) return;

      const g = text.trim();
      if (!g && !skipped) return;

      const correct =
        !skipped &&
        [current.diagnosis, ...current.aliases].some((answer) => {
          // Permissive matching, plus canonical collapse.
          const aCanon = canonicalizeDiagnosisDisplay(answer);
          const gCanon = canonicalizeDiagnosisDisplay(g);

          return (
            normalizeKeyForDedup(aCanon) === normalizeKeyForDedup(gCanon) ||
            normalizeAnswer(answer) === normalizeAnswer(g)
          );
        });

      const newGuesses = [...guesses, { text: skipped ? "Skipped" : g, correct, skipped }];
      setGuesses(newGuesses);
      setGuess("");
      setShowDropdown(false);

      if (correct) {
        setWon(true);
        setGameOver(true);
        setShowConfetti(true);
        setSolvedAtClueCount(revealed);
        return;
      }

      setRevealed((prev) => Math.min(prev + 1, current.clues.length));
      if (newGuesses.length >= MAX_GUESSES) setGameOver(true);
    },
    [current, gameOver, guesses, revealed]
  );

  // =============================================================
  // LOADING / ERROR STATES
  // =============================================================

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg, color: theme.text }}>
        <div className="max-w-xl rounded-lg p-6 border" style={{ background: theme.bgCard, borderColor: theme.border }}>
          <p className="text-lg font-semibold mb-2">Could not load the cases file.</p>
          <p className="text-sm" style={{ color: theme.textMuted }}>{loadError}</p>
          <p className="text-sm mt-3" style={{ color: theme.textMuted }}>
            Put your daily cases in <span className="font-mono">public/doctordle cases/medicle cases daily.txt</span> and endless cases in <span className="font-mono">medicle cases endless mode.txt</span>.
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

  // =============================================================
  // UI
  // =============================================================

  return (
    <main
      className="relative min-h-screen flex flex-col items-center px-4 py-8 transition-colors duration-300"
      style={{ background: theme.bg, color: theme.text }}
    >
      <MedicalDecor theme={theme} />
      {showConfetti && <Confetti />}
      <Analytics />

      {gameOver && current && (
        <ResultModal
          won={won}
          current={current}
          guesses={guesses}
          solvedAtClueCount={solvedAtClueCount}
          onRandom={startRandomCase}
          onArchive={startArchiveCase}
          onBackToDaily={startDailyCase}
          caseMode={caseMode}
          theme={theme}
        />
      )}

      <div className="relative z-10 w-full max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <StethoscopeIcon size={26} color={theme.accent} opacity={0.9} />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight leading-tight">Medicle</h1>
              <a
                href="https://www.medicle.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium hover:underline"
                style={{ color: theme.accent }}
              >
                www.medicle.net
              </a>
            </div>
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
              defaultValue="medicle"
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
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-6"
          style={{ background: theme.selectBg, border: `1px solid ${theme.border}`, color: theme.text }}
          disabled={!eligibleCases.length}
        >
          {caseOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: theme.border }}>
          <BoneIcon size={18} color={theme.accent} opacity={0.55} />
          <h2 className="text-lg font-semibold">What&apos;s the diagnosis?</h2>
        </div>

        <div className="space-y-3 mb-6">
          {current.clues.slice(0, revealed).map((clue, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: theme.text }}>
              {clue}
            </p>
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
