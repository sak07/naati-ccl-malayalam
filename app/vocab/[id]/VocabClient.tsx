'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { VocabList } from '@/lib/vocab-data';
import { useProgress } from '@/lib/useProgress';

interface Props { vocab: VocabList; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabClient({ vocab }: Props) {
  const [mode, setMode] = useState<'flashcard' | 'list'>('flashcard');
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [isShuffled] = useState(true);
  const [search, setSearch] = useState('');

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [direction, setDirection] = useState<'en-to-ml' | 'ml-to-en'>('en-to-ml');

  const { recordVocabKnown } = useProgress();
  const ordered = useMemo(() => shuffle(vocab.terms), [vocab.terms]);

  const term = ordered[current];
  const front = direction === 'en-to-ml' ? term.english : term.manglish;
  const back  = direction === 'en-to-ml' ? term.manglish : term.english;

  const reveal = useCallback(() => setRevealed(true), []);

  const handleKnow = useCallback((didKnow: boolean) => {
    if (didKnow) {
      setKnown(prev => new Set([...prev, current]));
      recordVocabKnown(1);
    }
    if (current < ordered.length - 1) {
      setCurrent(c => c + 1);
      setRevealed(false);
    } else {
      setDone(true);
    }
  }, [current, ordered.length, recordVocabKnown]);

  const restart = useCallback(() => {
    setCurrent(0);
    setRevealed(false);
    setKnown(new Set());
    setDone(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode !== 'flashcard' || done) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!revealed) reveal(); else handleKnow(true); }
      else if (e.key === 'ArrowRight' && revealed) handleKnow(true);
      else if (e.key === 'ArrowLeft'  && revealed) handleKnow(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, revealed, done, reveal, handleKnow]);

  const filteredList = vocab.terms.filter(t =>
    t.english.toLowerCase().includes(search.toLowerCase()) ||
    t.manglish.toLowerCase().includes(search.toLowerCase())
  );

  // ── Completion ────────────────────────────────────────────────
  if (done && mode === 'flashcard') {
    return (
      <div className="flex flex-col items-center py-16 gap-5 text-center animate-popIn">
        <div className="text-6xl animate-bounce-slow">{known.size === ordered.length ? '🌟' : '💪'}</div>
        <h2 className="text-xl font-bold text-slate-800">
          {known.size === ordered.length ? 'Perfect!' : `${known.size} of ${ordered.length} known`}
        </h2>
        <p className="text-slate-500 text-sm max-w-xs">
          {known.size === ordered.length
            ? 'You know every word in this list!'
            : 'Keep practising — you\'ll get them all!'}
        </p>
        <div className="flex gap-3">
          <button onClick={restart} className="px-5 py-2.5 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-all">
            Go again
          </button>
          <a href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mode switcher + settings */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode('flashcard')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'flashcard' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >Flashcards</button>
          <button
            onClick={() => setMode('list')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >Word list</button>
        </div>

        {mode === 'flashcard' && (
          <button
            onClick={() => setShowSettings(v => !v)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && mode === 'flashcard' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 animate-slideDown">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Settings</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Direction</span>
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
              <button onClick={() => setDirection('en-to-ml')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${direction === 'en-to-ml' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>EN → ML</button>
              <button onClick={() => setDirection('ml-to-en')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${direction === 'ml-to-en' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>ML → EN</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLASHCARD ────────────────────────────────────────── */}
      {mode === 'flashcard' && (
        <div className="space-y-4">
          {/* Counter + progress */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              <span className="font-bold text-slate-800">{current + 1}</span> of {ordered.length}
            </span>
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${((current + 1) / ordered.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-emerald-600 font-medium">{known.size} known</span>
          </div>

          {/* Front card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center animate-popIn">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              {direction === 'en-to-ml' ? 'English' : 'Manglish'}
            </p>
            <p className="text-2xl font-bold text-slate-800">{front}</p>
          </div>

          {/* Reveal / answer */}
          {!revealed ? (
            <button
              onClick={reveal}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-base font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
            >
              Show meaning
            </button>
          ) : (
            <>
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 text-center animate-slideDown">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                  {direction === 'en-to-ml' ? 'Manglish' : 'English'}
                </p>
                <p className="text-xl font-bold text-slate-800">{back}</p>
              </div>

              <div className="flex gap-3 animate-fadeIn">
                <button
                  onClick={() => handleKnow(false)}
                  className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-bold hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all"
                >
                  Still learning
                </button>
                <button
                  onClick={() => handleKnow(true)}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all"
                >
                  Got it ✓
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── WORD LIST ────────────────────────────────────────── */}
      {mode === 'list' && (
        <div className="space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search words…"
              className="w-full pl-9 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-50">
            {filteredList.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">No results</p>
            )}
            {filteredList.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium text-slate-800 flex-1">{t.english}</span>
                <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm text-indigo-600 font-medium flex-1 text-right">{t.manglish}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-right">{filteredList.length} words</p>
        </div>
      )}
    </div>
  );
}
