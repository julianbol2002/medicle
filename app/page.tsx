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

const VITALS_STATES = [
  { label: "Stable", color: "#22c55e", path: "M0,50 Q25,20 50,50 Q75,80 100,50 Q125,20 150,50 Q175,80 200,50" },
  { label: "Elevated", color: "#86efac", path: "M0,50 Q20,15 50,50 Q70,75 100,50 Q120,15 150,50 Q170,75 200,50" },
  { label: "Concerning", color: "#facc15", path: "M0,50 Q15,10 50,50 Q65,80 100,50 Q115,10 150,50 Q165,80 200,50" },
  { label: "Critical", color: "#f97316", path: "M0,50 Q10,5 50,50 Q60,90 100,50 Q110,5 150,50 Q160,90 200,50" },
  { label: "Severe", color: "#ef4444", path: "M0,50 Q8,0 50,50 Q58,95 100,50 Q108,0 150,50 Q158,95 200,50" },
  { label: "Critical", color: "#dc2626", path: "M0,50 Q5,0 50,50 Q55,98 100,50 Q105,0 150,50 Q155,98 200,50" },
];

const FLATLINE = "M0,50 L200,50";

function VitalsMonitor({ wrongGuesses, gameOver, won }: { wrongGuesses: number; gameOver: boolean; won: boolean }) {
  const state = VITALS_STATES[Math.min(wrongGuesses, VITALS_STATES.length - 1)];
  const flatlined = gameOver && !won;

  return (
    <div className="max-w-xl w-full mb-4 bg-slate-950 rounded-2xl p-3 border border-slate-700">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-slate-400">VITALS MONITOR</span>
        <span className="text-xs font-mono" style={{ color: flatlined ? "#ef4444" : state.color }}>
          ● {flatlined ? "FLATLINE" : wrongGuesses === 0 ? "STABLE" : state.label}
        </span>
      </div>
      <svg viewBox="0 0 200 100" className="w-full h-16">
        <rect width="200" height="100" fill="#0a0a0a" rx="4" />
        {/* Grid lines */}
        {[25, 50, 75].map(y => (
          <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#1e293b" strokeWidth="0.5" />
        ))}
        {[50, 100, 150].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#1e293b" strokeWidth="0.5" />
        ))}
        {/* Waveform */}
        <path
          d={flatlined ? FLATLINE : state.path}
          fill="none"
          stroke={flatlined ? "#ef4444" : state.color}
          strokeWidth={flatlined ? "1.5" : "2"}
          strokeLinecap="round"
        />
        {/* Animated dot */}
        {!flatlined && (
          <circle r="3" fill={state.color}>
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={state.path}
            />
          </circle>
        )}
      </svg>
      <div className="flex justify-between mt-1">
        {Array.from({ length: MAX_GUESSES }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full flex-1 mx-0.5 transition-all duration-500"
            style={{
              background: i < wrongGuesses
                ? (flatlined ? "#ef4444" : state.color)
                : "#1e293b"
            }}
          />
        ))}
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

      {/* Header */}
      <h1 className="text-3xl font-bold text-white mt-8 mb-1">Medicle</h1>
      <p className="text-teal-400 mb-1">What&apos;s the Diagnosis?</p>
      {gamesPlayed > 0 && (
        <p className="text-slate-500 text-xs mb-3">Case #{gamesPlayed + 1}</p>
      )}

      {/* Progress */}
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

      {/* Vitals Monitor */}
      <VitalsMonitor wrongGuesses={wrongGuesses} gameOver={gameOver} won={won} />

      {/* Clues — separate cards */}
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

      {/* End screen */}
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

      {/* Guess history */}
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

      {/* Footer */}
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