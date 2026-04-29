'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Exchange } from '@/lib/types';
import { useProgress } from '@/lib/useProgress';

interface Props {
  exchanges: Exchange[];
  dialogueId: string;
}

function isMalayalam(text: string): boolean {
  return /[ഀ-ൿ]/.test(text);
}

type Direction = 'en-to-ml' | 'ml-to-en';

export default function PracticeClient({ exchanges, dialogueId }: Props) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  // Settings (hidden behind gear)
  const [showSettings, setShowSettings] = useState(false);
  const [manglish, setManglish] = useState(true);
  const [direction, setDirection] = useState<Direction>('en-to-ml');

  const { recordExchanges } = useProgress();

  const exchange = exchanges[current];
  const isPromptMalayalam = isMalayalam(exchange.prompt);

  const promptText = manglish ? exchange.manglishPrompt : exchange.prompt;
  const answerText = manglish ? exchange.manglishAnswer : exchange.answer;

  // Which side shows first vs second based on direction
  const showFirst = direction === 'en-to-ml'
    ? (isPromptMalayalam ? answerText : promptText)
    : (isPromptMalayalam ? promptText : answerText);

  const showSecond = direction === 'en-to-ml'
    ? (isPromptMalayalam ? promptText : answerText)
    : (isPromptMalayalam ? answerText : promptText);

  const firstIsML = direction === 'en-to-ml' ? isPromptMalayalam : !isPromptMalayalam;

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

  // ── Completion screen ─────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center py-16 gap-5 text-center animate-popIn">
        <div className="text-6xl animate-bounce-slow">🎉</div>
        <h2 className="text-xl font-bold text-slate-800">You finished this dialogue!</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          Great work — you practised all {exchanges.length} exchanges.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={restart}
            className="px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all"
          >
            Practise again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all"
          >
            Choose another
          </a>
        </div>
      </div>
    );
  }

  // ── Main practice UI ──────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Counter + settings */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{current + 1}</span> of {exchanges.length}
        </span>

        {/* Minimal progress bar */}
        <div className="flex-1 mx-4 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / exchanges.length) * 100}%` }}
          />
        </div>

        {/* Settings gear */}
        <button
          onClick={() => setShowSettings(v => !v)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            showSettings ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
          title="Settings"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Settings panel (hidden by default) */}
      {showSettings && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-slideDown">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Show Malayalam as Manglish</span>
            <button
              onClick={() => setManglish(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${manglish ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${manglish ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Direction</span>
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setDirection('en-to-ml')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${direction === 'en-to-ml' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
              >EN → ML</button>
              <button
                onClick={() => setDirection('ml-to-en')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${direction === 'ml-to-en' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
              >ML → EN</button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-popIn">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {firstIsML ? (manglish ? 'Manglish' : 'Malayalam') : 'English'}
        </p>
        <p className="text-slate-800 text-lg leading-relaxed">{showFirst}</p>
      </div>

      {/* Reveal / Translation */}
      {!revealed ? (
        <button
          onClick={reveal}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
        >
          Show translation
        </button>
      ) : (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 animate-slideDown">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
            {!firstIsML ? (manglish ? 'Manglish' : 'Malayalam') : 'English'}
          </p>
          <p className="text-slate-800 text-lg leading-relaxed">{showSecond}</p>
        </div>
      )}

      {/* Navigation */}
      {revealed && (
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
      )}
    </div>
  );
}
