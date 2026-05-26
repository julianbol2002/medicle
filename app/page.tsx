"use client";
import { useState, useEffect, useCallback } from "react";

type Case = {
  id: string;
  diagnosis: string;
  aliases: string[];
  clues: string[];
};

function parseCases(text: string): Case[] {
  const cases: Case[] = [];
  const blocks = text.split(/\nCASE_ID:/).filter(Boolean);
  for (const block of blocks) {
    const idMatch = block.match(/^[\s\S]*?(\d+)/);
    const diagMatch = block.match(/DIAGNOSIS:\s*\n([^\n]+)/);
    const aliasMatch = block.match(/ALIASES:\s*\n([\s\S]*?)(?=\nVIGNETTE_LINES:)/);
    const clueMatch = block.match(/VIGNETTE_LINES:\s*\n([\s\S]*?)(?=\nTEACHING_POINTS:|\nCASE_ID:|$)/);
    if (!diagMatch || !clueMatch) continue;
    const diagnosis = diagMatch[1].trim();
    const aliases = aliasMatch
      ? aliasMatch[1].split("\n").map(a => a.replace(/^[-\s]+/, "").trim()).filter(Boolean)
      : [];
    const clues = clueMatch[1]
      .split("\n")
      .map(l => l.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
    cases.push({ id: idMatch?.[1] || "0", diagnosis, aliases, clues });
  }
  return cases;
}

const MAX_GUESSES = 6;

// Real ECG QRS complex path - one beat cycle
const ECG_BEAT = "M0,50 L10,50 L12,48 L14,52 L16,20 L18,80 L20,45 L22,50 L34,50 L36,48 L38,52 L40,16 L42,84 L44,45 L46,50 L58,50 L60,48 L62,52 L64,20 L66,80 L68,45 L70,50 L82,50 L84,48 L86,52 L88,16 L90,84 L92,45 L94,50 L106,50 L108,48 L110,52 L112,20 L114,80 L116,45 L118,50 L130,50 L132,48 L134,52 L136,16 L138,84 L140,45 L142,50 L160,50 L162,48 L164,52 L166,20 L168,80 L170,45 L172,50 L184,50 L186,48 L188,52 L190,16 L192,84 L194,45 L196,50 L200,50";

// Deteriorating rhythms
const ECG_PATHS = [
  // 0 wrong - normal sinus
  ECG_BEAT,
  // 1 wrong - slightly fast
  "M0,50 L8,50 L10,47 L12,53 L14,18 L16,82 L18,44 L20,50 L30,50 L32,47 L34,53 L36,14 L38,86 L40,44 L42,50 L52,50 L54,47 L56,53 L58,18 L60,82 L62,44 L64,50 L74,50 L76,47 L78,53 L80,14 L82,86 L84,44 L86,50 L96,50 L98,47 L100,53 L102,18 L104,82 L106,44 L108,50 L118,50 L120,47 L122,53 L124,14 L126,86 L128,44 L130,50 L140,50 L142,47 L144,53 L146,18 L148,82 L150,44 L152,50 L162,50 L164,47 L166,53 L168,14 L170,86 L172,44 L174,50 L184,50 L186,47 L188,53 L190,18 L192,82 L194,44 L196,50 L200,50",
  // 2 wrong - tachycardia, irregular
  "M0,50 L6,50 L8,46 L10,54 L12,15 L14,85 L16,43 L18,50 L26,50 L28,55 L30,45 L32,50 L38,50 L40,46 L42,54 L44,12 L46,88 L48,43 L50,50 L58,50 L60,46 L62,54 L64,15 L66,85 L68,43 L70,50 L78,52 L80,48 L82,50 L88,50 L90,46 L92,54 L94,12 L96,88 L98,43 L100,50 L108,50 L110,46 L112,54 L114,15 L116,85 L118,43 L120,50 L128,50 L130,53 L132,47 L134,50 L140,50 L142,46 L144,54 L146,12 L148,88 L150,43 L152,50 L160,50 L162,46 L164,54 L166,15 L168,85 L170,43 L172,50 L180,50 L182,53 L184,47 L186,50 L192,46 L194,54 L196,12 L198,88 L200,50",
  // 3 wrong - ST changes, wide QRS
  "M0,50 L5,50 L7,55 L9,45 L11,10 L13,90 L15,55 L17,45 L19,50 L25,50 L27,53 L29,47 L31,50 L37,50 L39,55 L41,45 L43,10 L45,90 L47,55 L49,45 L51,50 L57,50 L59,55 L61,45 L63,10 L65,90 L67,55 L69,45 L71,50 L77,53 L79,47 L81,50 L87,50 L89,55 L91,45 L93,10 L95,90 L97,55 L99,45 L101,50 L107,50 L109,55 L111,45 L113,10 L115,90 L117,55 L119,45 L121,50 L127,53 L129,47 L131,50 L137,50 L139,55 L141,45 L143,10 L145,90 L147,55 L149,45 L151,50 L160,50 L162,55 L164,45 L166,10 L168,90 L170,55 L172,45 L174,50 L180,53 L182,47 L184,50 L190,50 L192,55 L194,45 L196,10 L198,90 L200,50",
  // 4 wrong - V-tach like, chaotic
  "M0,50 L4,30 L6,70 L8,20 L10,80 L12,40 L14,60 L16,25 L18,75 L20,45 L22,55 L24,30 L26,70 L28,15 L30,85 L32,45 L34,55 L36,35 L38,65 L40,20 L42,80 L44,40 L46,60 L48,30 L50,70 L52,50 L54,25 L56,75 L58,40 L60,60 L62,20 L64,80 L66,45 L68,55 L70,30 L72,70 L74,15 L76,85 L78,45 L80,55 L82,35 L84,65 L86,20 L88,80 L90,40 L92,60 L94,30 L96,70 L98,50 L100,25 L102,75 L104,40 L106,60 L108,20 L110,80 L112,45 L114,55 L116,30 L118,70 L120,15 L122,85 L124,45 L126,55 L128,35 L130,65 L132,20 L134,80 L136,40 L138,60 L140,30 L142,70 L144,50 L146,25 L148,75 L150,40 L152,60 L154,20 L156,80 L158,45 L160,55 L162,30 L164,70 L166,15 L168,85 L170,45 L172,55 L174,35 L176,65 L178,20 L180,80 L182,40 L184,60 L186,30 L188,70 L190,50 L192,25 L194,75 L196,45 L198,55 L200,50",
  // 5 wrong - v-fib, completely chaotic
  "M0,50 L2,42 L4,63 L6,35 L8,71 L10,28 L12,58 L14,44 L16,67 L18,32 L20,55 L22,40 L24,68 L26,25 L28,72 L30,38 L32,56 L34,48 L36,65 L38,30 L40,60 L42,45 L44,70 L46,28 L48,55 L50,42 L52,68 L54,33 L56,58 L58,47 L60,72 L62,30 L64,55 L66,43 L68,65 L70,28 L72,60 L74,45 L76,70 L78,32 L80,55 L82,40 L84,68 L86,25 L88,72 L90,38 L92,56 L94,48 L96,63 L98,30 L100,58 L102,44 L104,67 L106,28 L108,55 L110,42 L112,70 L114,33 L116,58 L118,47 L120,72 L122,30 L124,53 L126,43 L128,65 L130,28 L132,60 L134,45 L136,68 L138,32 L140,55 L142,40 L144,70 L146,25 L148,72 L150,38 L152,56 L154,48 L156,63 L158,30 L160,58 L162,44 L164,67 L166,28 L168,55 L170,42 L172,68 L174,33 L176,58 L178,47 L180,72 L182,30 L184,55 L186,43 L188,65 L190,28 L192,60 L194,45 L196,70 L198,35 L200,50",
];

const VITALS_STAGES = [
  { hr: "72", bp: "118/76", o2: "99", rhythm: "Normal Sinus", hrColor: "#22c55e", o2Color: "#22c55e", bpColor: "#22c55e", ecgColor: "#22c55e" },
  { hr: "88", bp: "134/84", o2: "97", rhythm: "Sinus Tachycardia", hrColor: "#86efac", o2Color: "#22c55e", bpColor: "#86efac", ecgColor: "#86efac" },
  { hr: "108", bp: "152/96", o2: "94", rhythm: "Tachycardia", hrColor: "#facc15", o2Color: "#facc15", bpColor: "#facc15", ecgColor: "#facc15" },
  { hr: "128", bp: "168/108", o2: "90", rhythm: "ST Changes", hrColor: "#f97316", o2Color: "#f97316", bpColor: "#f97316", ecgColor: "#f97316" },
  { hr: "156", bp: "88/52", o2: "84", rhythm: "V-Tach", hrColor: "#ef4444", o2Color: "#ef4444", bpColor: "#ef4444", ecgColor: "#ef4444" },
  { hr: "180", bp: "72/40", o2: "76", rhythm: "V-Fib", hrColor: "#dc2626", o2Color: "#dc2626", bpColor: "#dc2626", ecgColor: "#dc2626" },
];

function VitalsMonitor({ wrongGuesses, gameOver, won }: { wrongGuesses: number; gameOver: boolean; won: boolean }) {
  const idx = Math.min(wrongGuesses, VITALS_STAGES.length - 1);
  const stage = VITALS_STAGES[idx];
  const flatlined = gameOver && !won;
  const ecgPath = flatlined ? "M0,50 L200,50" : ECG_PATHS[idx];
  const ecgColor = flatlined ? "#ef4444" : stage.ecgColor;

  return (
    <div className="max-w-xl w-full mb-4 bg-slate-950 rounded-2xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-slate-500 tracking-widest">PATIENT MONITOR</span>
        <span className="text-xs font-mono animate-pulse" style={{ color: ecgColor }}>
          ● {flatlined ? "FLATLINE" : stage.rhythm}
        </span>
      </div>

      {/* ECG */}
      <svg viewBox="0 0 200 100" className="w-full h-14 mb-3" style={{ background: "#050a0e", borderRadius: "8px" }}>
        {[25, 50, 75].map(y => (
          <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#0f2027" strokeWidth="0.5" />
        ))}
        {[40, 80, 120, 160].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#0f2027" strokeWidth="0.5" />
        ))}
        <path
          d={ecgPath}
          fill="none"
          stroke={ecgColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {!flatlined && (
          <circle r="2.5" fill={ecgColor}>
            <animateMotion dur={wrongGuesses >= 4 ? "0.6s" : wrongGuesses >= 2 ? "1s" : "1.4s"} repeatCount="indefinite" path={ecgPath} />
          </circle>
        )}
      </svg>

      {/* Vitals row */}
      <div className="grid grid-cols-3 gap-2">
        {/* HR */}
        <div className="bg-slate-900 rounded-xl p-2 text-center border border-slate-800">
          <p className="text-slate-500 text-xs font-mono mb-1">HR</p>
          <p className="font-bold text-lg font-mono leading-none" style={{ color: flatlined ? "#ef4444" : stage.hrColor }}>
            {flatlined ? "---" : stage.hr}
          </p>
          <p className="text-slate-600 text-xs font-mono">bpm</p>
        </div>
        {/* BP */}
        <div className="bg-slate-900 rounded-xl p-2 text-center border border-slate-800">
          <p className="text-slate-500 text-xs font-mono mb-1">BP</p>
          <p className="font-bold text-sm font-mono leading-none" style={{ color: flatlined ? "#ef4444" : stage.bpColor }}>
            {flatlined ? "---" : stage.bp}
          </p>
          <p className="text-slate-600 text-xs font-mono">mmHg</p>
        </div>
        {/* O2 */}
        <div className="bg-slate-900 rounded-xl p-2 text-center border border-slate-800">
          <p className="text-slate-500 text-xs font-mono mb-1">SpO₂</p>
          <p className="font-bold text-lg font-mono leading-none" style={{ color: flatlined ? "#ef4444" : stage.o2Color }}>
            {flatlined ? "---" : stage.o2}%
          </p>
          <p className="text-slate-600 text-xs font-mono">O₂ sat</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [cases, setCases] = useState<Case[]>([]);
  const [current, setCurrent] = useState<Case | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(1);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<{ text: string; correct: boolean; skipped: boolean }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  const pickNewCase = useCallback((allCases: Case[], seen: Set<string>) => {
    const unseen = allCases.filter(c => !seen.has(c.id));
    const pool = unseen.length > 0 ? unseen : allCases;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  useEffect(() => {
    fetch("/cases.txt")
      .then(r => r.text())
      .then(text => {
        const parsed = parseCases(text);
        setCases(parsed);
        const first = parsed[Math.floor(Math.random() * parsed.length)];
        setCurrent(first);
        setSeenIds(new Set([first.id]));
      });
  }, []);

  const startNextCase = () => {
    const newSeen = new Set(seenIds);
    if (current) newSeen.add(current.id);
    const next = pickNewCase(cases, newSeen);
    setSeenIds(new Set([...newSeen, next.id]));
    setCurrent(next);
    setRevealed(1);
    setGuess("");
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    setShowDropdown(false);
    setGamesPlayed(g => g + 1);
  };

  const allDiagnoses = cases.flatMap(c => [c.diagnosis, ...c.aliases]);
  const filtered = guess.trim().length > 0
    ? allDiagnoses.filter(d => d.toLowerCase().includes(guess.toLowerCase().trim())).slice(0, 6)
    : [];

  const wrongGuesses = guesses.filter(g => !g.correct && !g.skipped).length;

  const submitGuess = (text: string, skipped = false) => {
    if (!current || gameOver) return;
    const g = text.trim();
    if (!g && !skipped) return;

    const correct = !skipped && (
      g.toLowerCase() === current.diagnosis.toLowerCase() ||
      current.aliases.some(a => a.toLowerCase() === g.toLowerCase())
    );

    const newGuesses = [...guesses, { text: skipped ? "Skipped" : g, correct, skipped }];
    setGuesses(newGuesses);
    setGuess("");
    setShowDropdown(false);

    if (correct) {
      setWon(true);
      setGameOver(true);
      return;
    }

    setRevealed(prev => Math.min(prev + 1, current.clues.length));

    if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
    }
  };

  if (!current) return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-white text-xl">Loading...</p>
    </main>
  );

  const guessesLeft = MAX_GUESSES - guesses.length;

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center p-6 pb-16">

      <h1 className="text-3xl font-bold text-white mt-8 mb-1">Medicle</h1>
      <p className="text-teal-400 mb-1">What&apos;s the Diagnosis?</p>
      {gamesPlayed > 0 && (
        <p className="text-slate-500 text-xs mb-3">Case #{gamesPlayed + 1}</p>
      )}

      <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
        <span>Clue {revealed}/{current.clues.length}</span>
        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${(revealed / current.clues.length) * 100}%` }}
          />
        </div>
        {!gameOver && <span>{guessesLeft} guess{guessesLeft !== 1 ? "es" : ""} left</span>}
      </div>

      <VitalsMonitor wrongGuesses={wrongGuesses} gameOver={gameOver} won={won} />

      <div className="max-w-xl w-full space-y-2 mb-4">
        {current.clues.slice(0, revealed).map((clue, i) => (
          <div
            key={i}
            className="bg-slate-800 rounded-xl px-5 py-3 text-gray-200 text-sm border-l-4 transition-all duration-300"
            style={{ borderColor: i === revealed - 1 ? "#14b8a6" : "#334155" }}
          >
            <span className="text-slate-500 text-xs font-mono mr-2">#{i + 1}</span>
            {clue}
          </div>
        ))}
      </div>

      {gameOver ? (
        <div
          className="max-w-xl w-full rounded-2xl p-6 text-center mt-2"
          style={{ background: won ? "rgb(20,83,45)" : "rgb(127,29,29)" }}
        >
          {won ? (
            <>
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-green-300 text-2xl font-bold mb-1">Correct!</p>
              <p className="text-white text-lg font-semibold mb-1">{current.diagnosis}</p>
              <p className="text-green-200 text-sm mb-4">
                You got it in {guesses.length} guess{guesses.length !== 1 ? "es" : ""}.
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-2">💀</p>
              <p className="text-red-300 text-2xl font-bold mb-1">Patient Lost</p>
              <p className="text-white text-sm mb-1">The diagnosis was:</p>
              <p className="text-white text-xl font-bold mb-4">{current.diagnosis}</p>
            </>
          )}
          <button
            onClick={startNextCase}
            className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors"
          >
            Next Case →
          </button>
        </div>
      ) : (
        <div className="relative max-w-xl w-full mb-2">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl bg-slate-700 text-white px-4 py-2 outline-none placeholder-slate-400"
              placeholder="Enter diagnosis..."
              value={guess}
              onChange={e => { setGuess(e.target.value); setShowDropdown(true); }}
              onKeyDown={e => e.key === "Enter" && submitGuess(guess)}
              onFocus={() => setShowDropdown(true)}
            />
            <button
              onClick={() => submitGuess(guess)}
              className="bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-xl font-bold transition-colors"
            >
              Guess
            </button>
            <button
              onClick={() => submitGuess("", true)}
              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-xl font-bold transition-colors"
            >
              Skip
            </button>
          </div>
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-10 w-full bg-slate-700 rounded-xl mt-1 overflow-hidden shadow-lg">
              {filtered.map((d, i) => (
                <div
                  key={i}
                  className="px-4 py-2 text-white hover:bg-teal-600 cursor-pointer"
                  onMouseDown={() => submitGuess(d)}
                >
                  {d}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 space-y-1 max-w-xl w-full">
        {guesses.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={g.skipped ? "text-slate-400" : g.correct ? "text-green-400" : "text-red-400"}>
              {g.skipped ? "—" : g.correct ? "✓" : "✗"}
            </span>
            <span className={g.skipped ? "text-slate-400" : g.correct ? "text-green-400" : "text-red-400"}>
              {g.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-xl w-full text-center space-y-3">
        <p className="text-slate-500 text-xs">
          ⚠️ Cases are AI-generated for educational purposes only and may contain inaccuracies. Not for clinical use.
        </p>
        <p className="text-slate-600 text-xs">
          Medicle is an independent, fan-made endless diagnosis game inspired by{" "}
          <a href="https://doctordle.org" target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:text-teal-500 underline">
            Doctordle
          </a>
          . We love what they built and created this as a complement — not a competitor — so medical students can practice endlessly. All credit to the Doctordle team for the original concept.
        </p>
        <p className="text-slate-500 text-xs">
          Questions or feedback?{" "}
          <a href="mailto:medle.game@gmail.com" className="text-teal-600 hover:text-teal-400 underline">
            medle.game@gmail.com
          </a>
        </p>
      </div>

    </main>
  );
}