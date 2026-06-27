'use client';

import { useState, useCallback, useEffect } from 'react';
import type { VocabList, VocabTerm } from '@/lib/vocab-data';
import { useProgress } from '@/lib/useProgress';
import { useVocabAdditions } from '@/lib/useVocabAdditions';

interface Props { vocab: VocabList; }

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

export default function VocabClient({ vocab }: Props) {
  const [mode, setMode] = useState<'flashcard' | 'list'>('flashcard');
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [search, setSearch] = useState('');

  const [direction, setDirection] = useState<'en-to-hi' | 'hi-to-en'>('en-to-hi');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEnglish, setNewEnglish] = useState('');
  const [newHindi, setNewHindi] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  const { recordVocabKnown } = useProgress();
  const { additions, addTerm, deleteTerm } = useVocabAdditions(vocab.id);

  const allTerms: VocabTerm[] = [...vocab.terms, ...additions];

  const [ordered, setOrdered] = useState<VocabTerm[]>(vocab.terms);
  useEffect(() => { setOrdered(shuffle(allTerms)); }, [vocab.terms, additions]);

  const term = ordered[current];
  const front = direction === 'en-to-hi' ? term?.english : term?.hindi;
  const back  = direction === 'en-to-hi' ? term?.hindi : term?.english;

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

  const filteredList = allTerms.filter(t =>
    t.english.toLowerCase().includes(search.toLowerCase()) ||
    t.hindi.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddTerm = useCallback(async () => {
    if (!newEnglish.trim() || !newHindi.trim()) { setAddError('Both fields required.'); return; }
    const duplicate = allTerms.some(t => t.english.toLowerCase() === newEnglish.trim().toLowerCase());
    if (duplicate) { setAddError('This English word already exists in the list.'); return; }
    setSaving(true);
    setAddError('');
    try {
      await addTerm(newEnglish.trim(), newHindi.trim());
      setNewEnglish('');
      setNewHindi('');
      setShowAddForm(false);
    } catch {
      setAddError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }, [newEnglish, newHindi, addTerm]);

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
      {/* Mode switcher + inline direction toggle */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
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

        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 ml-auto">
          <button onClick={() => setDirection('en-to-hi')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${direction === 'en-to-hi' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}>EN → HI</button>
          <button onClick={() => setDirection('hi-to-en')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${direction === 'hi-to-en' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}>HI → EN</button>
        </div>
      </div>

      {/* ── FLASHCARD ────────────────────────────────────────── */}
      {mode === 'flashcard' && (
        <div className="space-y-4">
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center animate-popIn min-h-[160px] flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              {direction === 'en-to-hi' ? 'English' : 'Hindi'}
            </p>
            {direction === 'hi-to-en' && front ? (() => {
              const { script, roman } = parseHindi(front);
              return (
                <>
                  <p className="text-3xl font-bold text-slate-900 leading-snug">{script}</p>
                  {roman && <p className="text-sm text-slate-400 mt-2 font-medium">{roman}</p>}
                </>
              );
            })() : (
              <p className="text-2xl font-bold text-slate-800">{front}</p>
            )}
          </div>

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
                  {direction === 'en-to-hi' ? 'Hindi' : 'English'}
                </p>
                {direction === 'en-to-hi' && back ? (() => {
                  const { script, roman } = parseHindi(back);
                  return (
                    <>
                      <p className="text-3xl font-bold text-slate-900 leading-snug">{script}</p>
                      {roman && <p className="text-sm text-slate-400 mt-2 font-medium">{roman}</p>}
                    </>
                  );
                })() : (
                  <p className="text-xl font-bold text-slate-800">{back}</p>
                )}
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
            {filteredList.map((t, i) => {
              const isAddition = 'id' in t;
              const { script, roman } = parseHindi(t.hindi);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                  <span className="text-sm font-medium text-slate-800 flex-1">{t.english}</span>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-indigo-700 leading-tight">{script}</p>
                    {roman && <p className="text-xs text-slate-400 mt-0.5">{roman}</p>}
                  </div>
                  {isAddition && (
                    <button
                      onClick={() => deleteTerm((t as VocabTerm & { id: string }).id)}
                      className="w-5 h-5 flex items-center justify-center text-slate-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add term form */}
          {showAddForm ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New word</p>
              <div className="flex gap-2">
                <input
                  value={newEnglish}
                  onChange={e => setNewEnglish(e.target.value)}
                  placeholder="English"
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  value={newHindi}
                  onChange={e => setNewHindi(e.target.value)}
                  placeholder="Hindi"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTerm(); }}
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {addError && <p className="text-xs text-red-500">{addError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddForm(false); setNewEnglish(''); setNewHindi(''); setAddError(''); }}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTerm}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add word
            </button>
          )}

          <p className="text-xs text-slate-400 text-right">{filteredList.length} words</p>
        </div>
      )}
    </div>
  );
}
