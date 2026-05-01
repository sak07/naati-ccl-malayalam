'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomVocab } from '@/lib/useCustomVocab';
import VocabClient from '@/app/vocab/[id]/VocabClient';
import type { VocabList } from '@/lib/vocab-data';

export default function CustomVocabPage() {
  const { id } = useParams<{ id: string }>();
  const decodedId = decodeURIComponent(id);
  const { getById, deleteVocab } = useCustomVocab();
  const [vocab, setVocab] = useState<VocabList | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    setVocab(getById(decodedId) ?? null);
  }, [decodedId, getById]);

  const handleDelete = () => {
    if (!confirm('Delete this vocabulary list?')) return;
    deleteVocab(decodedId);
    router.push('/');
  };

  if (vocab === undefined) return null;

  if (vocab === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f9fa' }}>
        <div className="text-center space-y-3">
          <p className="text-slate-500">Vocabulary list not found.</p>
          <a href="/" className="text-indigo-600 text-sm font-medium">Back to home</a>
        </div>
      </div>
    );
  }

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
          <span className="text-xs text-slate-400">Vocabulary</span>
          <div className="flex-1" />
          <button
            onClick={handleDelete}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{vocab.domain} Vocabulary</h1>
            <p className="text-sm text-slate-500 mt-1">{vocab.terms.length} words · Custom list</p>
          </div>
        </div>
        <VocabClient vocab={vocab} />
      </main>
    </div>
  );
}
