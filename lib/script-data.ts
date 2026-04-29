import rawData from './scripts.json';

export interface ScriptExchange {
  manglish: string;
  english: string;
}

export interface Script {
  id: string;
  title: string;
  domain: string;
  exchanges: ScriptExchange[];
}

export const scripts: Script[] = rawData as Script[];

export function getScriptById(id: string): Script | undefined {
  return scripts.find((s) => s.id === id);
}
