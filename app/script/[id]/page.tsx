import { notFound } from 'next/navigation';
import { getScriptById, scripts } from '@/lib/script-data';
import { DOMAIN_COLORS } from '@/lib/types';
import ScriptClient from './ScriptClient';

export async function generateStaticParams() {
  return scripts.map((s) => ({ id: encodeURIComponent(s.id) }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScriptPage({ params }: Props) {
  const { id } = await params;
  const script = getScriptById(decodeURIComponent(id));
  if (!script) notFound();

  const domainColor = DOMAIN_COLORS[script.domain] ?? 'bg-slate-100 text-slate-700';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Scripts
          </a>
          <div className="ml-auto">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${domainColor}`}>
              {script.domain}
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">{script.title}</h1>
        <ScriptClient script={script} />
      </main>
    </div>
  );
}
