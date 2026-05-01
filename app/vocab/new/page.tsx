'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomVocab } from '@/lib/useCustomVocab';
import type { VocabTerm } from '@/lib/vocab-data';

function blankTerm(): VocabTerm & { key: number } {
  return { key: Date.now() + Math.random(), english: '', manglish: '' };
}

export default function NewVocabPage() {
  const router = useRouter();
  const { addVocab } = useCustomVocab();
  const [domain, setDomain] = useState('');
  const [terms, setTerms] = useState([blankTerm()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateTerm = useCallback((index: number, field: 'english' | 'manglish', value: string) => {
    setTerms(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  }, []);

  const addRow = useCallback(() => {
    setTerms(prev => [...prev, blankTerm()]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setTerms(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!domain.trim()) { setError('Please enter a list name.'); return; }
    const valid = terms.filter(t => t.english.trim() && t.manglish.trim());
    if (valid.length === 0) { setError('Add at least one word pair.'); return; }
    setSaving(true);
    try {
      const id = await addVocab(domain.trim(), valid.map(({ english, manglish }) => ({ english, manglish })));
      router.push(`/vocab/custom/${encodeURIComponent(id)}`);
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  }, [domain, terms, addVocab, router]);

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </a>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-400">New Vocabulary List</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add Vocabulary List</h1>
          <p className="text-sm text-slate-500 mt-1">Create a custom word list to study with flashcards.</p>
        </div>

        {/* List name */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">List Name</label>
          <input
            value={domain}
            onChange={e => setDomain(e.target.value)}
            placeholder="e.g. Medical, Travel, Cooking…"
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Terms */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-slate-100 px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">English</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manglish</span>
          </div>
          <div className="divide-y divide-slate-50">
            {terms.map((t, i) => (
              <div key={t.key} className="flex items-center gap-2 px-4 py-2.5">
                <input
                  value={t.english}
                  onChange={e => updateTerm(i, 'english', e.target.value)}
                  placeholder="English"
                  className="flex-1 px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  value={t.manglish}
                  onChange={e => updateTerm(i, 'manglish', e.target.value)}
                  placeholder="Manglish"
                  className="flex-1 px-2.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {terms.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-slate-100">
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add word
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save & Study'}
        </button>
      </main>
    </div>
  );
}
