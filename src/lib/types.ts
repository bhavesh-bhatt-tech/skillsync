export interface Question {
  id: string;
  topic: string;
  subtopic: string;
  question: string;
  answer: string;
  type: string;
  starter_code: string | null;
  skills: string[];
  roles: string[];
  min_experience: number;
  created_at: string;
}

export interface QuestionInput {
  topic: string;
  subtopic: string;
  question: string;
  answer: string;
  type: string;
  starter_code?: string | null;
  skills: string[];
  roles: string[];
  min_experience: number;
}

export interface Filters {
  search: string;
  role: string;
  skills: string[];
  minExperience: number;
}

export const QUESTION_HEADERS = [
  'topic',
  'subtopic',
  'question',
  'answer',
  'type',
  'starterCode',
  'skills',
  'roles',
  'minExperience',
] as const;

export const REQUIRED_CSV_HEADERS = ['topic', 'subtopic', 'question', 'answer'];
