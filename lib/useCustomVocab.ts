'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VocabList, VocabTerm } from './vocab-data';

const STORAGE_KEY = 'naati_custom_vocabs';

function loadFromStorage(): VocabList[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VocabList[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(vocabs: VocabList[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabs));
}

export function useCustomVocab() {
  const [customVocabs, setCustomVocabs] = useState<VocabList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCustomVocabs(loadFromStorage());
    setLoading(false);
  }, []);

  const addVocab = useCallback(async (domain: string, terms: VocabTerm[]): Promise<string> => {
    const id = `custom-${Date.now()}`;
    const newVocab: VocabList = { id, domain, terms };
    setCustomVocabs(prev => {
      const updated = [...prev, newVocab];
      saveToStorage(updated);
      return updated;
    });
    return id;
  }, []);

  const deleteVocab = useCallback(async (id: string) => {
    setCustomVocabs(prev => {
      const updated = prev.filter(v => v.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const getById = useCallback((id: string): VocabList | undefined => {
    return customVocabs.find(v => v.id === id);
  }, [customVocabs]);

  return { customVocabs, loading, addVocab, deleteVocab, getById };
}
