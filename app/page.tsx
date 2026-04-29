import { getDialoguesByDomain, DOMAIN_ORDER, dialogues } from '@/lib/data';
import { vocabularies } from '@/lib/vocab-data';
import { scripts } from '@/lib/script-data';
import HomeClient from './HomeClient';

export default function Home() {
  const byDomain = getDialoguesByDomain();
  const orderedDomains = [
    ...DOMAIN_ORDER.filter((d) => byDomain[d]),
    ...Object.keys(byDomain).filter((d) => !DOMAIN_ORDER.includes(d)),
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            N
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">NAATI CCL Practice</h1>
            <p className="text-xs text-slate-400 mt-0.5">Malayalam · English</p>
          </div>
        </div>
      </header>

      <HomeClient
        dialogues={dialogues}
        orderedDomains={orderedDomains}
        byDomain={byDomain}
        vocabularies={vocabularies}
        scripts={scripts}
      />
    </div>
  );
}
