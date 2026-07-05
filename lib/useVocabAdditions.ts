'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VocabTerm } from './vocab-data';

interface Addition extends VocabTerm {
  id: string;
}

function storageKey(vocabId: string) {
  return `naati_vocab_additions_${vocabId}`;
}

function loadAdditions(vocabId: string): Addition[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(vocabId));
    return raw ? (JSON.parse(raw) as Addition[]) : [];
  } catch {
    return [];
  }
}

function saveAdditions(vocabId: string, additions: Addition[]) {
  localStorage.setItem(storageKey(vocabId), JSON.stringify(additions));
}

export function useVocabAdditions(vocabId: string) {
  const [additions, setAdditions] = useState<Addition[]>([]);

  useEffect(() => {
    setAdditions(loadAdditions(vocabId));
  }, [vocabId]);

  const addTerm = useCallback(async (english: string, hindi: string) => {
    const id = `add-${Date.now()}`;
    const newTerm: Addition = { id, english, hindi };
    setAdditions(prev => {
      const updated = [...prev, newTerm];
      saveAdditions(vocabId, updated);
      return updated;
    });
  }, [vocabId]);

  const deleteTerm = useCallback(async (id: string) => {
    setAdditions(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAdditions(vocabId, updated);
      return updated;
    });
  }, [vocabId]);

  return { additions, addTerm, deleteTerm };
}
