'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

const BATCH = 20;

export default function VocabQuizClient({ allTerms }: Props) {
  const [queue, setQueue]         = useState<TermWithDomain[]>(() => shuffle(allTerms).slice(0, BATCH));
  const [index, setIndex]         = useState(0);
  const [input, setInput]         = useState('');
  const [result, setResult]       = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore]         = useState(0);
  const [done, setDone]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { recordVocabKnown } = useProgress();

  const term = queue[index];

  const submit = useCallback(() => {
    if (!term || result !== null) return;
    const correct = input.trim().toLowerCase() === term.manglish.trim().toLowerCase();
    setResult(correct ? 'correct' : 'wrong');
    if (correct) { setScore(s => s + 1); recordVocabKnown(1); }
  }, [term, input, result, recordVocabKnown]);

  const next = useCallback(() => {
    if (index < queue.length - 1) {
      setIndex(i => i + 1);
      setInput('');
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setDone(true);
    }
  }, [index, queue.length]);

  const restart = useCallback(() => {
    setQueue(shuffle(allTerms).slice(0, BATCH));
    setIndex(0);
    setInput('');
    setResult(null);
    setScore(0);
    setDone(false);
  }, [allTerms]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Enter') { result === null ? submit() : next(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [result, submit, next]);

  if (done) {
    return (
      <div className="flex flex-col items-center py-16 gap-5 text-center animate-popIn">
        <div className="text-6xl animate-bounce-slow">{score === queue.length ? '🌟' : '💪'}</div>
        <h2 className="text-xl font-bold text-slate-800">
          {score === queue.length ? 'Perfect score!' : `${score} / ${queue.length} correct`}
        </h2>
        <p className="text-slate-500 text-sm max-w-xs">
          {score === queue.length ? 'You nailed every word!' : 'Keep practising — you\'ll get them all!'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={restart}
            className="px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all"
          >
            New batch
          </button>
          <a href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  if (!term) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{index + 1}</span> of {queue.length}
        </span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / queue.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-emerald-600 font-medium">{score} correct</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center animate-popIn">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">English</p>
        <p className="text-2xl font-bold text-slate-800 mb-2">{term.english}</p>
        <span className="inline-block text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{term.domain}</span>
      </div>

      <div className="space-y-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => { if (result === null) setInput(e.target.value); }}
          placeholder="Type the Manglish word…"
          disabled={result !== null}
          autoFocus
          className={`w-full px-4 py-3 text-base rounded-xl border-2 focus:outline-none transition-all ${
            result === 'correct' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' :
            result === 'wrong'   ? 'border-red-300 bg-red-50 text-red-800' :
            'border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
          }`}
        />

        {result === 'wrong' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-slideDown">
            Correct answer: <span className="font-bold">{term.manglish}</span>
          </div>
        )}
        {result === 'correct' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 animate-slideDown">
            Correct!
          </div>
        )}
      </div>

      {result === null ? (
        <button
          onClick={submit}
          disabled={!input.trim()}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200 disabled:opacity-40"
        >
          Check
        </button>
      ) : (
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
        >
          {index < queue.length - 1 ? 'Next →' : 'See results'}
        </button>
      )}
    </div>
  );
}
