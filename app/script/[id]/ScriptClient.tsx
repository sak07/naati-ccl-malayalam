'use client';

import { useState } from 'react';
import type { Script } from '@/lib/script-data';

interface Props { script: Script; }

type ShowMode = 'both' | 'hindi' | 'english';

export default function ScriptClient({ script }: Props) {
  const [show, setShow] = useState<ShowMode>('both');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const toggleReveal = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const revealAll = () => setRevealed(new Set(script.exchanges.map((_, i) => i)));
  const hideAll   = () => setRevealed(new Set());

  const isCover = show !== 'both';

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
          {([
            { key: 'both',     label: 'Both' },
            { key: 'hindi', label: 'Hindi only' },
            { key: 'english',  label: 'English only' },
          ] as { key: ShowMode; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setShow(key); setRevealed(new Set()); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                show === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isCover && (
          <div className="flex gap-1">
            <button onClick={revealAll} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 transition-all">Reveal all</button>
            <button onClick={hideAll}   className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 transition-all">Hide all</button>
          </div>
        )}
      </div>

      {isCover && (
        <p className="text-xs text-slate-400 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {show === 'hindi' ? 'Hindi' : 'English'} is hidden. Read each line and tap to reveal the translation.
        </p>
      )}

      {/* Script lines */}
      <div className="space-y-3">
        {script.exchanges.map((ex, i) => {
          const isRevealed = revealed.has(i) || show === 'both';
          const hindiVisible = show !== 'english';
          const englishVisible  = show !== 'hindi';

          return (
            <div
              key={i}
              className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden ${
                isCover ? 'cursor-pointer hover:border-indigo-300' : 'border-slate-200'
              }`}
              onClick={isCover ? () => toggleReveal(i) : undefined}
            >
              {/* Hindi side */}
              {ex.hindi && (
                <div className={`px-4 py-3 flex items-start gap-3 ${!englishVisible ? '' : 'border-b border-slate-100'}`}>
                  <span className="shrink-0 mt-0.5 text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                    Hindi
                  </span>
                  <p className={`text-sm text-slate-800 leading-relaxed transition-all ${
                    hindiVisible || isRevealed ? 'opacity-100' : 'opacity-0 blur-sm select-none pointer-events-none'
                  }`}>
                    {ex.hindi}
                  </p>
                  {!hindiVisible && !isRevealed && (
                    <span className="text-xs text-slate-400 ml-auto mt-0.5 shrink-0">tap to reveal</span>
                  )}
                </div>
              )}

              {/* English side */}
              {ex.english && (
                <div className="px-4 py-3 flex items-start gap-3 bg-slate-50/60">
                  <span className="shrink-0 mt-0.5 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    English
                  </span>
                  <p className={`text-sm text-slate-800 leading-relaxed transition-all ${
                    englishVisible || isRevealed ? 'opacity-100' : 'opacity-0 blur-sm select-none pointer-events-none'
                  }`}>
                    {ex.english}
                  </p>
                  {!englishVisible && !isRevealed && (
                    <span className="text-xs text-slate-400 ml-auto mt-0.5 shrink-0">tap to reveal</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
