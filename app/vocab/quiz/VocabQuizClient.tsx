'use client';

import { useState, useCallback, useEffect } from 'react';
import type { VocabTerm } from '@/lib/vocab-data';
import { useProgress } from '@/lib/useProgress';
import { useIncorrectVocab } from '@/lib/useIncorrectVocab';

interface TermWithDomain extends VocabTerm { domain: string; }
interface Props { allTerms: TermWithDomain[]; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseHindi(h: string) {
  const m = h.match(/^(.+?)\s*\(([^)]+)\)/);
  return m ? { script: m[1].trim(), roman: m[2].trim() } : { script: h, roman: '' };
}

function getOptions(correct: TermWithDomain, pool: TermWithDomain[]): TermWithDomain[] {
  const others = shuffle(pool.filter(t => t.hindi !== correct.hindi));
  return shuffle([correct, ...others.slice(0, 3)]);
}

const BATCH = 15;

export default function VocabQuizClient({ allTerms }: Props) {
  const [restartKey, setRestartKey] = useState(0);
  const [quizTerms, setQuizTerms] = useState<TermWithDomain[]>([]);
  const [index, setIndex]         = useState(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [score, setScore]         = useState(0);
  const [done, setDone]           = useState(false);
  const [options, setOptions]     = useState<TermWithDomain[]>([]);
  
  // Track incorrect ones specifically in this run
  const [wrongInCurrentRun, setWrongInCurrentRun] = useState<TermWithDomain[]>([]);

  // Persistent tracker for wrong terms across all lists
  const { addIncorrect, removeIncorrect } = useIncorrectVocab();
  const { recordVocabKnown } = useProgress();

  // Initialize terms
  useEffect(() => {
    setQuizTerms(shuffle(allTerms).slice(0, BATCH));
  }, [allTerms]);

  const term = quizTerms[index];

  useEffect(() => {
    if (term) setOptions(getOptions(term, allTerms));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, term]);

  const pick = useCallback((opt: TermWithDomain) => {
    if (selected !== null) return;
    setSelected(opt.hindi);
    if (opt.hindi === term.hindi) {
      setScore(s => s + 1);
      recordVocabKnown(1);
      // If we got it right, remove it from the general wrong lists if it was there
      removeIncorrect(term.english);
    } else {
      // Add to current run's incorrect collection
      setWrongInCurrentRun(prev => [...prev, term]);
      // Persist to incorrect storage
      addIncorrect(term);
    }
    setTimeout(() => {
      if (index < quizTerms.length - 1) {
        setIndex(i => i + 1);
        setSelected(null);
      } else {
        setDone(true);
      }
    }, 1400);
  }, [selected, term, index, quizTerms.length, recordVocabKnown, addIncorrect, removeIncorrect]);

  const restart = useCallback(() => {
    setQuizTerms(shuffle(allTerms).slice(0, BATCH));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setWrongInCurrentRun([]);
  }, [allTerms]);

  const startIncorrectOnlyQuiz = useCallback(() => {
    if (wrongInCurrentRun.length > 0) {
      setQuizTerms(shuffle(wrongInCurrentRun));
      setIndex(0);
      setSelected(null);
      setScore(0);
      setDone(false);
      setWrongInCurrentRun([]);
    }
  }, [wrongInCurrentRun]);

  if (done) {
    const pct = Math.round((score / quizTerms.length) * 100);
    return (
      <div className="flex flex-col items-center py-12 gap-5 text-center animate-popIn">
        <div className="text-7xl">{score === quizTerms.length ? '🌟' : score >= quizTerms.length * 0.7 ? '💪' : '📚'}</div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{score} / {quizTerms.length}</h2>
          <p className="text-slate-500 text-sm mt-1">{pct}% correct</p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${score === quizTerms.length ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-slate-500 text-sm max-w-xs">
          {score === quizTerms.length ? 'Perfect! Every word correct.' : score >= quizTerms.length * 0.7 ? 'Great work — keep practising!' : 'Keep going, you\'ll get there!'}
        </p>

        {wrongInCurrentRun.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 w-full text-left space-y-2 max-w-sm mx-auto">
            <span className="text-xs font-bold text-red-700 block">Words to review:</span>
            <div className="flex flex-wrap gap-1.5">
              {wrongInCurrentRun.map((w, idx) => (
                <span key={idx} className="text-xs bg-white border border-red-200 text-red-700 font-semibold px-2 py-0.5 rounded-lg">
                  {w.english}
                </span>
              ))}
            </div>
            <button
              onClick={startIncorrectOnlyQuiz}
              className="w-full mt-2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              🔄 Practise Just These {wrongInCurrentRun.length} Incorrect Words
            </button>
          </div>
        )}

        <div className="flex gap-3 w-full max-w-sm mt-2">
          <button onClick={restart} className="flex-1 py-3 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all">
            Try again
          </button>
          <a href="/" className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all text-center">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  if (!term || options.length < 2) return null;

  const pct = Math.round((index / quizTerms.length) * 100);

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span><span className="font-semibold text-slate-700">{index + 1}</span> of {quizTerms.length}</span>
          <span className="text-emerald-600 font-semibold">{score} correct</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">What is the Hindi for…</p>
        <p className="text-3xl font-bold text-slate-900 leading-tight">{term.english}</p>
        <span className="inline-block mt-3 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{term.domain}</span>
      </div>

      {/* Multiple choice options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const { script, roman } = parseHindi(opt.hindi);
          const isCorrect = opt.hindi === term.hindi;
          const isSelected = selected === opt.hindi;

          let bg = 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm active:scale-[0.97]';
          if (selected !== null) {
            if (isCorrect) bg = 'bg-emerald-50 border-emerald-400 shadow-sm';
            else if (isSelected) bg = 'bg-red-50 border-red-400';
            else bg = 'bg-white border-slate-100 opacity-50';
          }

          return (
            <button
              key={i}
              onClick={() => pick(opt)}
              className={`rounded-2xl border-2 px-4 py-4 text-center transition-all cursor-pointer ${bg}`}
            >
              <p className="text-xl font-bold text-slate-900 leading-snug">{script}</p>
              {roman && <p className="text-xs text-slate-400 mt-1 font-medium">{roman}</p>}
              {selected !== null && isCorrect && (
                <span className="inline-block mt-1.5 text-xs font-bold text-emerald-600">✓ correct</span>
              )}
              {selected !== null && isSelected && !isCorrect && (
                <span className="inline-block mt-1.5 text-xs font-bold text-red-500">✗ wrong</span>
              )}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="text-xs text-slate-400 text-center animate-fadeIn">
          {selected === term.hindi ? '✓ Correct! Moving on…' : 'Wrong — the correct answer is highlighted above'}
        </p>
      )}
    </div>
  );
}
