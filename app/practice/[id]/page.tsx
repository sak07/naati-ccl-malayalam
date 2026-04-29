import { notFound } from 'next/navigation';
import { getDialogueById, dialogues } from '@/lib/data';
import PracticeClient from './PracticeClient';

export async function generateStaticParams() {
  return dialogues.map((d) => ({ id: encodeURIComponent(d.id) }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PracticePage({ params }: Props) {
  const { id } = await params;
  const dialogue = getDialogueById(decodeURIComponent(id));
  if (!dialogue) notFound();

  return (
    <div className="min-h-screen bg-f8f9fa" style={{ background: '#f8f9fa' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </a>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-400">{dialogue.domain}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Title block */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">{dialogue.title}</h1>
          {dialogue.description && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{dialogue.description}</p>
          )}
        </div>

        <PracticeClient exchanges={dialogue.exchanges} dialogueId={dialogue.id} />
      </main>
    </div>
  );
}
