import { vocabularies } from '@/lib/vocab-data';
import VocabQuizClient from './VocabQuizClient';

export default function VocabQuizPage() {
  const allTerms = vocabularies.flatMap(v => v.terms.map(t => ({ ...t, domain: v.domain })));
  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/" className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Vocabulary Quiz</h1>
            <p className="text-xs text-slate-400 mt-0.5">All {allTerms.length} words · random order</p>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <VocabQuizClient allTerms={allTerms} />
      </div>
    </div>
  );
}
