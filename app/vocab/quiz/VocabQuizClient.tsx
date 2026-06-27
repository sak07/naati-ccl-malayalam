'use client';

import { useState, useCallback, useEffect } from 'react';
import type { VocabTerm } from '@/lib/vocab-data';
import { useProgress } from '@/lib/useProgress';

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
  const [queue]    = useState<TermWithDomain[]>(() => shuffle(allTerms).slice(0, BATCH));
  const [index, setIndex]         = useState(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [score, setScore]         = useState(0);
  const [done, setDone]           = useState(false);
  const [options, setOptions]     = useState<TermWithDomain[]>([]);
  const { recordVocabKnown } = useProgress();

  const term = queue[index];

  useEffect(() => {
    if (term) setOptions(getOptions(term, allTerms));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const pick = useCallback((opt: TermWithDomain) => {
    if (selected !== null) return;
    setSelected(opt.hindi);
    if (opt.hindi === term.hindi) {
      setScore(s => s + 1);
      recordVocabKnown(1);
    }
    setTimeout(() => {
      if (index < queue.length - 1) {
        setIndex(i => i + 1);
        setSelected(null);
      } else {
        setDone(true);
      }
    }, 1400);
  }, [selected, term, index, queue.length, recordVocabKnown]);

  const restart = useCallback(() => {
    setRestartKey(k => k + 1);
  }, []);

  if (restartKey > 0) {
    return <VocabQuizClient allTerms={allTerms} />;
  }

  if (done) {
    const pct = Math.round((score / queue.length) * 100);
    return (
      <div className="flex flex-col items-center py-12 gap-5 text-center animate-popIn">
        <div className="text-7xl">{score === queue.length ? '🌟' : score >= queue.length * 0.7 ? '💪' : '📚'}</div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{score} / {queue.length}</h2>
          <p className="text-slate-500 text-sm mt-1">{pct}% correct</p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${score === queue.length ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-slate-500 text-sm max-w-xs">
          {score === queue.length ? 'Perfect! Every word correct.' : score >= queue.length * 0.7 ? 'Great work — keep practising!' : 'Keep going, you\'ll get there!'}
        </p>
        <div className="flex gap-3 w-full">
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

  const pct = Math.round((index / queue.length) * 100);

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span><span className="font-semibold text-slate-700">{index + 1}</span> of {queue.length}</span>
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
