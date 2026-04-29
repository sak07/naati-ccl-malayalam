'use client';

import { useState, useEffect, useCallback } from 'react';

interface ProgressData {
  streak: number;
  lastDate: string;
  totalExchanges: number;
  completedDialogueIds: string[];
  knownVocabCount: number;
  lastPracticedId: string;
}

const DEFAULT: ProgressData = {
  streak: 0,
  lastDate: '',
  totalExchanges: 0,
  completedDialogueIds: [],
  knownVocabCount: 0,
  lastPracticedId: '',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function load(): ProgressData {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem('naati_progress');
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function save(data: ProgressData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('naati_progress', JSON.stringify(data));
}

export function useProgress() {
  const [data, setData] = useState<ProgressData>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = load();
    // Update streak
    const today = todayStr();
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    let streak = loaded.streak;
    if (loaded.lastDate !== today) {
      if (loaded.lastDate === yesterday) {
        // maintain streak (will increment on first practice today)
      } else if (loaded.lastDate !== '') {
        streak = 0; // broke streak
      }
    }
    const updated = { ...loaded, streak };
    setData(updated);
    setHydrated(true);
  }, []);

  const recordExchanges = useCallback((dialogueId: string, count: number) => {
    setData(prev => {
      const today = todayStr();
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      let streak = prev.streak;
      if (prev.lastDate !== today) {
        streak = prev.lastDate === yesterday || prev.lastDate === '' ? streak + 1 : 1;
      }
      const completedDialogueIds = prev.completedDialogueIds.includes(dialogueId)
        ? prev.completedDialogueIds
        : [...prev.completedDialogueIds, dialogueId];
      const updated = {
        ...prev,
        streak,
        lastDate: today,
        totalExchanges: prev.totalExchanges + count,
        completedDialogueIds,
        lastPracticedId: dialogueId,
      };
      save(updated);
      return updated;
    });
  }, []);

  const recordVocabKnown = useCallback((count: number) => {
    setData(prev => {
      const today = todayStr();
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      let streak = prev.streak;
      if (prev.lastDate !== today) {
        streak = prev.lastDate === yesterday || prev.lastDate === '' ? streak + 1 : 1;
      }
      const updated = {
        ...prev,
        streak,
        lastDate: today,
        knownVocabCount: prev.knownVocabCount + count,
      };
      save(updated);
      return updated;
    });
  }, []);

  return { data, hydrated, recordExchanges, recordVocabKnown };
}
