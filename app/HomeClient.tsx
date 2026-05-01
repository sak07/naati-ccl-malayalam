'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Dialogue } from '@/lib/types';
import type { VocabList } from '@/lib/vocab-data';
import type { Script } from '@/lib/script-data';
import { LEVEL_COLORS } from '@/lib/types';
import { useCustomVocab } from '@/lib/useCustomVocab';

type Tab = 'practice' | 'vocab' | 'scripts';

interface Props {
  dialogues: Dialogue[];
  orderedDomains: string[];
  byDomain: Record<string, Dialogue[]>;
  vocabularies: VocabList[];
  scripts: Script[];
}

const DOMAIN_ICONS: Record<string, string> = {
  Education: '🎓', Housing: '🏠', Finance: '💰', Legal: '⚖️',
  Insurance: '🛡️', 'Social Service': '🤝', Immigration: '✈️',
  Business: '💼', Community: '👥', 'Consumer Affairs': '🛒', Health: '❤️',
};

const VOCAB_ICONS: Record<string, string> = {
  ...{
    Education: '🎓', Housing: '🏠', Finance: '💰', Insurance: '🛡️',
    Legal: '⚖️', 'Social Service': '🤝', Immigration: '✈️',
    Business: '💼', Community: '👥', 'Consumer Affairs': '🛒',
    Health: '❤️', Office: '🗂️',
  }
};

const LEVEL_LABEL: Record<string, string> = {
  Easy: 'Easy', Medium: 'Medium', 'Medium (Exam)': 'Medium',
  Hard: 'Hard', 'Very Hard': 'Very Hard',
};
const LEVEL_DOT: Record<string, string> = {
  Easy: 'bg-emerald-400', Medium: 'bg-amber-400',
  'Medium (Exam)': 'bg-amber-400', Hard: 'bg-red-400', 'Very Hard': 'bg-red-600',
};

export default function HomeClient({ dialogues, orderedDomains, byDomain, vocabularies, scripts }: Props) {
  const [tab, setTab] = useState<Tab>('practice');
  const { customVocabs } = useCustomVocab();
  const allVocabs = [...vocabularies, ...customVocabs];

  return (
    <main className="max-w-2xl mx-auto px-4 pb-16">

      {/* Intro line */}
      <p className="text-slate-500 text-sm text-center mt-6 mb-5 animate-fadeUp">
        Pick what you want to practise today
      </p>

      {/* Tab bar — 3 clear choices */}
      <div className="grid grid-cols-3 gap-2 mb-8 animate-fadeUp delay-100">
        {([
          { key: 'practice', icon: '💬', label: 'Dialogues',  sub: `${dialogues.length} topics` },
          { key: 'vocab',    icon: '📖', label: 'Vocabulary', sub: `${allVocabs.length} lists` },
          { key: 'scripts',  icon: '📄', label: 'Scripts',    sub: `${scripts.length} scripts` },
        ] as { key: Tab; icon: string; label: string; sub: string }[]).map(({ key, icon, label, sub }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 transition-all ${
              tab === key
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm'
            }`}
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
            <span className={`text-xs ${tab === key ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</span>
          </button>
        ))}
      </div>

      {/* ── DIALOGUES ─────────────────────────────────────────── */}
      {tab === 'practice' && (
        <div className="space-y-8 animate-fadeUp">
          {orderedDomains.map((domain) => {
            const items = byDomain[domain];
            const icon = DOMAIN_ICONS[domain] ?? '📚';
            return (
              <section key={domain}>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                  <span>{icon}</span> {domain}
                </h2>
                <div className="space-y-2">
                  {items.map((d) => {
                    const dot = LEVEL_DOT[d.level] ?? 'bg-slate-300';
                    const levelLabel = LEVEL_LABEL[d.level] ?? d.level;
                    return (
                      <Link
                        key={d.id}
                        href={`/practice/${encodeURIComponent(d.id)}`}
                        className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-slate-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
                      >
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                        <span className="flex-1 text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                          {d.title}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">{levelLabel}</span>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── VOCABULARY ────────────────────────────────────────── */}
      {tab === 'vocab' && (
        <div className="space-y-2 animate-fadeUp">
          {allVocabs.map((v) => {
            const isCustom = v.id.startsWith('custom-');
            const icon = VOCAB_ICONS[v.domain] ?? '📚';
            const href = isCustom
              ? `/vocab/custom/${encodeURIComponent(v.id)}`
              : `/vocab/${encodeURIComponent(v.id)}`;
            return (
              <Link
                key={v.id}
                href={href}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 border border-slate-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 flex items-center gap-2">
                    {v.domain}
                    {isCustom && (
                      <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">Custom</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{v.terms.length} words</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
          <Link
            href="/vocab/new"
            className="flex items-center justify-center gap-2 bg-white rounded-xl px-4 py-4 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-slate-400 hover:text-indigo-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Add vocabulary list</span>
          </Link>
        </div>
      )}

      {/* ── SCRIPTS ───────────────────────────────────────────── */}
      {tab === 'scripts' && (
        <div className="space-y-2 animate-fadeUp">
          <p className="text-sm text-slate-500 mb-4">Read the full conversation in Manglish and English — great warmup before flashcard practice.</p>
          {scripts.map((s) => {
            const icon = DOMAIN_ICONS[s.domain] ?? '📚';
            return (
              <Link
                key={s.id}
                href={`/script/${encodeURIComponent(s.id)}`}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-4 border border-slate-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.domain} · {s.exchanges.length} exchanges</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
