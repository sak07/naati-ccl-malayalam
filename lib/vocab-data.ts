import rawData from './vocabularies.json';
import extractedData from './extracted-vocabularies.json';

export interface VocabTerm {
  english: string;
  hindi: string;
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

export function getExtractedVocabByDomain(domain: string): VocabTerm[] {
  const key = domain.toLowerCase();
  return (extractedData as Record<string, VocabTerm[]>)[key] || [];
}
