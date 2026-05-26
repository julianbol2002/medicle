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
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return picked;
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
    newSeen.add(current?.id || "");
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

    const nextRevealed = Math.min(revealed + 1, current.clues.length);
    setRevealed(nextRevealed);

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
      <h1 className="text-3xl font-bold text-white mt-8 mb-1">Diagnos.io</h1>
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

      {/* Clues */}
      <div className="bg-slate-800 rounded-2xl p-6 max-w-xl w-full text-white space-y-3 mb-4">
        {current.clues.slice(0, revealed).map((clue, i) => (
          <p key={i} className="text-gray-200">{clue}</p>
        ))}
      </div>

      {/* End screen */}
      {gameOver ? (
        <div className="max-w-xl w-full rounded-2xl p-6 text-center mt-2"
          style={{ background: won ? "rgb(20,83,45)" : "rgb(127,29,29)" }}>
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
              <p className="text-4xl mb-2">🩺</p>
              <p className="text-red-300 text-2xl font-bold mb-1">Better Luck Next Time</p>
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
        /* Input */
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
          <div key={i} className="flex items-center gap-2">
            <span className={g.skipped ? "text-slate-400" : g.correct ? "text-green-400" : "text-red-400"}>
              {g.skipped ? "—" : g.correct ? "✓" : "✗"}
            </span>
            <span className={g.skipped ? "text-slate-400" : g.correct ? "text-green-400" : "text-red-400"}>
              {g.text}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-8 text-slate-500 text-xs text-center max-w-md">
        ⚠️ Cases are AI-generated for educational purposes only and may contain inaccuracies. Not for clinical use.
      </p>
    </main>
  );
}