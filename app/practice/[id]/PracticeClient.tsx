'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Exchange } from '@/lib/types';
import { useProgress } from '@/lib/useProgress';

interface Props {
  exchanges: Exchange[];
  dialogueId: string;
}

function isEnglish(text: string): boolean {
  return /^[A-Za-z\s.,!?'"()\-:;0-9]+$/.test(text.trim());
}

export default function PracticeClient({ exchanges, dialogueId }: Props) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState<'en-first' | 'other-first'>('en-first');

  const { recordExchanges } = useProgress();

  const exchange = exchanges[current];

  // Detect which field is English
  const promptIsEnglish = isEnglish(exchange.prompt);
  const englishText = promptIsEnglish ? exchange.prompt : exchange.answer;
  const translationText = promptIsEnglish ? exchange.answer : exchange.prompt;

  const showFirst  = direction === 'en-first' ? englishText : translationText;
  const showSecond = direction === 'en-first' ? translationText : englishText;
  const firstLabel  = direction === 'en-first' ? 'English' : 'Translation';
  const secondLabel = direction === 'en-first' ? 'Translation' : 'English';

  const reveal = useCallback(() => setRevealed(true), []);

  const next = useCallback(() => {
    recordExchanges(dialogueId, 1);
    if (current < exchanges.length - 1) {
      setCurrent(c => c + 1);
      setRevealed(false);
    } else {
      setDone(true);
    }
  }, [current, exchanges.length, dialogueId, recordExchanges]);

  const prev = useCallback(() => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setRevealed(false);
    }
  }, [current]);

  const restart = useCallback(() => {
    setCurrent(0);
    setRevealed(false);
    setDone(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) reveal(); else next();
      } else if (e.key === 'ArrowRight' && revealed) next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, reveal, next, prev]);

  // ── Completion ─────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center py-16 gap-5 text-center animate-popIn">
        <div className="text-6xl animate-bounce-slow">🎉</div>
        <h2 className="text-xl font-bold text-slate-800">You finished this dialogue!</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          Great work — you practised all {exchanges.length} exchanges.
        </p>
        <div className="flex gap-3 mt-2">
          <button onClick={restart} className="px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all">
            Practise again
          </button>
          <a href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all">
            Choose another
          </a>
        </div>
      </div>
    );
  }

  const pct = ((current + 1) / exchanges.length) * 100;

  return (
    <div className="space-y-5">

      {/* Progress bar + counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            <span className="font-bold text-slate-800">{current + 1}</span> of {exchanges.length}
          </span>
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setDirection('en-first')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${direction === 'en-first' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >EN first</button>
            <button
              onClick={() => setDirection('other-first')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${direction === 'other-first' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >Translate first</button>
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Prompt card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 animate-popIn">
        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
          firstLabel === 'English' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
        }`}>{firstLabel}</span>
        <p className="text-lg text-slate-800 leading-relaxed">{showFirst}</p>
      </div>

      {/* Reveal / Answer */}
      {!revealed ? (
        <button
          onClick={reveal}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
        >
          Show {secondLabel}
        </button>
      ) : (
        <>
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-6 py-8 animate-slideDown">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${
              secondLabel === 'English' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
            }`}>{secondLabel}</span>
            <p className="text-lg text-slate-800 leading-relaxed">{showSecond}</p>
          </div>

          <div className="flex gap-3 animate-fadeIn">
            <button
              onClick={prev}
              disabled={current === 0}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-all"
            >
              {current === exchanges.length - 1 ? '🎉 Finish' : 'Next'}
              {current < exchanges.length - 1 && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
