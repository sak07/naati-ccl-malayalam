import type { Dialogue } from './types';
import dialoguesData from './dialogues.json';

export const dialogues: Dialogue[] = dialoguesData as Dialogue[];

export function getDialogueById(id: string): Dialogue | undefined {
  return dialogues.find((d) => d.id === id);
}

export function getDialoguesByDomain(): Record<string, Dialogue[]> {
  const map: Record<string, Dialogue[]> = {};
  for (const d of dialogues) {
    if (!map[d.domain]) map[d.domain] = [];
    map[d.domain].push(d);
  }
  return map;
}

export const DOMAIN_ORDER = [
  'Education',
  'Housing',
  'Finance',
  'Insurance',
  'Legal',
  'Social Service',
  'Immigration',
  'Business',
  'Community',
  'Consumer Affairs',
];
