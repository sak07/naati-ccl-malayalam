export interface Exchange {
  prompt: string;
  answer: string;
  hindiPrompt: string;
  hindiAnswer: string;
}

export interface Dialogue {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: string;
  exchanges: Exchange[];
}

export type Domain = {
  name: string;
  dialogues: Dialogue[];
};

export const LEVEL_ORDER: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  'Medium (Exam)': 3,
  Hard: 4,
  'Very Hard': 5,
};

export const DOMAIN_COLORS: Record<string, string> = {
  Education: 'bg-blue-100 text-blue-800',
  Housing: 'bg-green-100 text-green-800',
  Finance: 'bg-yellow-100 text-yellow-800',
  Immigration: 'bg-purple-100 text-purple-800',
  Business: 'bg-orange-100 text-orange-800',
  'Social Service': 'bg-teal-100 text-teal-800',
  Insurance: 'bg-red-100 text-red-800',
  Community: 'bg-pink-100 text-pink-800',
  Legal: 'bg-gray-100 text-gray-800',
  'Consumer Affairs': 'bg-indigo-100 text-indigo-800',
};

export const LEVEL_COLORS: Record<string, string> = {
  Easy: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  'Medium (Exam)': 'bg-amber-100 text-amber-700',
  Hard: 'bg-red-100 text-red-700',
  'Very Hard': 'bg-red-200 text-red-800',
};
