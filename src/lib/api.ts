import type { Question as AppQuestion, QuestionInput } from './types';
import { ADMIN_KEY_STORAGE } from './adminAuth';

type ApiQuestion = {
  id: string;
  topic: string;
  subtopic: string;
  question: string;
  answer?: string | null;
  answer_markdown?: string | null;
  answerMarkdown?: string | null;
  type: AppQuestion['type'];
  starterCode?: string | null;
  skills: string[];
  roles: string[];
  minExperience: number;
  createdAt: string;
};

function toQuestion(question: ApiQuestion): AppQuestion {
  const answer = question.answer?.trim()
    ? question.answer
    : question.answer_markdown ?? question.answerMarkdown ?? '';

  return {
    id: question.id,
    topic: question.topic,
    subtopic: question.subtopic,
    question: question.question,
    answer,
    type: question.type,
    starter_code: question.starterCode ?? null,
    skills: question.skills ?? [],
    roles: question.roles ?? [],
    min_experience: question.minExperience ?? 0,
    created_at: question.createdAt,
  };
}

function toApiPayload(question: Partial<QuestionInput>) {
  return {
    topic: question.topic,
    subtopic: question.subtopic,
    question: question.question,
    answer: question.answer,
    type: question.type,
    starterCode: question.starter_code,
    skills: question.skills,
    roles: question.roles,
    minExperience: question.min_experience,
  };
}

// Dynamically read API base URL targeting your Express server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function apiFetch(url: string, init: RequestInit = {}, admin = false) {
  const headers = new Headers(init.headers);
  if (admin) {
    const adminKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (adminKey) headers.set('x-admin-key', adminKey);
  }
  return fetch(url, { ...init, headers });
}

/**
 * Fetch all questions with optional search and filter params
 */
export async function fetchQuestions(filters?: {
  search?: string;
  role?: string;
  skill?: string;
  minExperience?: number;
}): Promise<AppQuestion[]> {
  const queryParams = new URLSearchParams();
  
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.role) queryParams.append('role', filters.role);
  if (filters?.skill) queryParams.append('skill', filters.skill);
  if (filters?.minExperience !== undefined && filters.minExperience > 0) {
    queryParams.append('experience', filters.minExperience.toString());
  }

  const query = queryParams.toString();
  const url = query ? `${API_BASE_URL}/questions?${query}` : `${API_BASE_URL}/questions`;
  
  const response = await apiFetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to fetch questions: ${response.statusText}`);
  }
  const data = await response.json() as ApiQuestion[];
  return data.map(toQuestion);
}

export async function fetchAdminQuestions(): Promise<AppQuestion[]> {
  const response = await apiFetch(`${API_BASE_URL}/questions`, {}, true);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to fetch questions: ${response.statusText}`);
  }
  return (await response.json() as ApiQuestion[]).map(toQuestion);
}

export const fetchAllQuestions = fetchAdminQuestions;

/**
 * Create a single question via Admin Form
 */
export async function createQuestion(questionData: QuestionInput): Promise<AppQuestion> {
  const response = await apiFetch(`${API_BASE_URL}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toApiPayload(questionData)),
  }, true);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to create question: ${response.statusText}`);
  }
  
  return toQuestion(await response.json() as ApiQuestion);
}

/**
 * Update an existing question by ID
 */
export async function updateQuestion(id: string, questionData: Partial<QuestionInput>): Promise<AppQuestion> {
  const response = await apiFetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(toApiPayload(questionData)),
  }, true);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to update question: ${response.statusText}`);
  }

  return toQuestion(await response.json() as ApiQuestion);
}

/**
 * Delete a question by ID
 */
export async function deleteQuestion(id: string): Promise<{ success: boolean }> {
  const response = await apiFetch(`${API_BASE_URL}/questions/${id}`, {
    method: 'DELETE',
  }, true);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to delete question: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Batch insert pre-parsed JSON questions array
 */
export async function batchInsertQuestions(questions: any[]): Promise<{ count: number; inserted: number; updated: number }> {
  const response = await apiFetch(`${API_BASE_URL}/questions/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(questions.map((question) => toApiPayload(question))),
  }, true);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to batch insert questions: ${response.statusText}`);
  }

  return await response.json();
}
