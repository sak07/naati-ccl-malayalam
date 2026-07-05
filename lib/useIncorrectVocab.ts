import { useState, useEffect, useCallback } from 'react';
import type { VocabTerm } from './vocab-data';

const STORAGE_KEY = 'naaticcl_incorrect_vocab';

export function useIncorrectVocab() {
  const [incorrectList, setIncorrectList] = useState<VocabTerm[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setIncorrectList(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse incorrect vocab list:', e);
        }
      }
    }
  }, []);

  const saveList = (list: VocabTerm[]) => {
    setIncorrectList(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  };

  const addIncorrect = useCallback((term: VocabTerm) => {
    setIncorrectList(prev => {
      // Avoid duplicate entries
      const exists = prev.some(t => t.english.toLowerCase() === term.english.toLowerCase());
      if (exists) return prev;
      const updated = [...prev, term];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const removeIncorrect = useCallback((english: string) => {
    setIncorrectList(prev => {
      const updated = prev.filter(t => t.english.toLowerCase() !== english.toLowerCase());
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const clearIncorrect = useCallback(() => {
    setIncorrectList([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    incorrectList,
    addIncorrect,
    removeIncorrect,
    clearIncorrect,
  };
}
