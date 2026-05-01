'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VocabList, VocabTerm } from './vocab-data';
import { supabase } from './supabase';

export function useCustomVocab() {
  const [customVocabs, setCustomVocabs] = useState<VocabList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('custom_vocabularies')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setCustomVocabs(data as VocabList[]);
        setLoading(false);
      });
  }, []);

  const addVocab = useCallback(async (domain: string, terms: VocabTerm[]): Promise<string> => {
    const id = `custom-${Date.now()}`;
    const { error } = await supabase
      .from('custom_vocabularies')
      .insert({ id, domain, terms });
    if (error) throw error;
    setCustomVocabs(prev => [...prev, { id, domain, terms }]);
    return id;
  }, []);

  const deleteVocab = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('custom_vocabularies')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setCustomVocabs(prev => prev.filter(v => v.id !== id));
  }, []);

  const getById = useCallback((id: string): VocabList | undefined => {
    return customVocabs.find(v => v.id === id);
  }, [customVocabs]);

  return { customVocabs, loading, addVocab, deleteVocab, getById };
}
