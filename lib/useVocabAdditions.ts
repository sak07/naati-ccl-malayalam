'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VocabTerm } from './vocab-data';
import { supabase } from './supabase';

interface Addition extends VocabTerm {
  id: string;
}

export function useVocabAdditions(vocabId: string) {
  const [additions, setAdditions] = useState<Addition[]>([]);

  useEffect(() => {
    supabase
      .from('vocab_additions')
      .select('*')
      .eq('vocab_id', vocabId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setAdditions(data as Addition[]); });
  }, [vocabId]);

  const addTerm = useCallback(async (english: string, manglish: string) => {
    const id = `add-${Date.now()}`;
    const { error } = await supabase
      .from('vocab_additions')
      .insert({ id, vocab_id: vocabId, english, manglish });
    if (error) throw error;
    setAdditions(prev => [...prev, { id, english, manglish }]);
  }, [vocabId]);

  const deleteTerm = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('vocab_additions')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setAdditions(prev => prev.filter(a => a.id !== id));
  }, []);

  return { additions, addTerm, deleteTerm };
}
