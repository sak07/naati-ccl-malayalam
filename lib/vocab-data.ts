import rawData from './vocabularies.json';

export interface VocabTerm {
  english: string;
  manglish: string;
}

export interface VocabList {
  id: string;
  domain: string;
  terms: VocabTerm[];
}

export const vocabularies: VocabList[] = rawData as VocabList[];

export function getVocabById(id: string): VocabList | undefined {
  return vocabularies.find((v) => v.id === id);
}
