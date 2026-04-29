import { notFound } from 'next/navigation';
import { getVocabById, vocabularies } from '@/lib/vocab-data';
import VocabClient from './VocabClient';

export async function generateStaticParams() {
  return vocabularies.map((v) => ({ id: encodeURIComponent(v.id) }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VocabPage({ params }: Props) {
  const { id } = await params;
  const vocab = getVocabById(decodeURIComponent(id));
  if (!vocab) notFound();

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
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">{vocab.domain} Vocabulary</h1>
          <p className="text-sm text-slate-500 mt-1">{vocab.terms.length} words</p>
        </div>
        <VocabClient vocab={vocab} />
      </main>
    </div>
  );
}
