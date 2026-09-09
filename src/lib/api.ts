const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://skillsync-np8p.onrender.com/api';
const ADMIN_KEY_STORAGE = 'admin_session';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// FIX 1: Add timeout and retry logic
async function apiFetch(url: string, init: RequestInit = {}, admin = false) {
  const sessionKey = sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? '';
  const headers = new Headers(init.headers);

  if (admin && sessionKey) {
    headers.set('x-admin-key', sessionKey);
  }

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on abort or auth errors
      if (lastError.name === 'AbortError' || lastError.message?.includes('401')) {
        throw lastError;
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

// FIX 2: Add type-safe error extraction
function extractErrorMessage(data: unknown): string {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.message === 'string') return obj.message;
  }
  return 'Unknown error';
}

export interface Question {
  id: string;
  topic: string;
  subtopic: string;
  question: string;
  answer: string;
  type: 'CONCEPTUAL' | 'PRACTICAL' | 'SYSTEM_DESIGN' | 'CODING';
  starterCode?: string | null;
  skills: string[];
  roles: string[];
  minExperience: number;
  createdAt: string;
  updatedAt: string;
}

type AppQuestion = Omit<Question, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

type ApiQuestion = Question;

function toQuestion(q: ApiQuestion): AppQuestion {
  return {
    id: q.id,
    topic: q.topic,
    subtopic: q.subtopic,
    question: q.question,
    answer: q.answer,
    type: q.type,
    starterCode: q.starterCode,
    skills: q.skills,
    roles: q.roles,
    minExperience: q.minExperience,
  };
}

const FALLBACK_QUESTIONS: AppQuestion[] = [
  {
    id: 'fallback-1',
    topic: 'Java',
    subtopic: 'Concurrency',
    question: 'What are Virtual Threads in Java 21 and how do they improve throughput?',
    answer:
      '**Virtual Threads** (JEP 444) are lightweight threads managed by the JVM rather than the OS.\n\n' +
      '## Why they matter\n\n' +
      '| Platform Thread | Virtual Thread |\n|---|---|\n| ~1 MB stack | ~few KB stack |\n| OS-scheduled | JVM-scheduled |\n| ~thousands max | ~millions max |\n\n' +
      '```java\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 10_000).forEach(i ->\n        executor.submit(() -> { Thread.sleep(Duration.ofSeconds(1)); return i; })\n    );\n}\n```',
    type: 'CONCEPTUAL',
    skills: ['Java 21', 'Concurrency', 'Virtual Threads'],
    roles: ['Backend Engineer', 'Tech Lead'],
    minExperience: 5,
  },
  {
    id: 'fallback-2',
    topic: 'Java',
    subtopic: 'Data Structures',
    question: 'Implement an LRU Cache in Java',
    answer:
      'Design a Least Recently Used (LRU) cache with **O(1)** get and put operations.\n\n' +
      '## Approach\n\nCombine a **doubly linked list** with a **hash map**.\n\n' +
      '| Operation | Time | Space |\n|---|---|---|\n| get | O(1) | O(capacity) |\n| put | O(1) | O(capacity) |',
    type: 'CODING',
    starterCode:
      'import java.util.*;\n\nclass LRUCache {\n    private final int capacity;\n    private final Map<Integer, Node> map = new HashMap<>();\n\n    static class Node { int key, val; Node prev, next; Node(int k, int v) { key = k; val = v; } }\n\n    public LRUCache(int capacity) { this.capacity = capacity; }\n\n    public int get(int key) { return -1; }\n\n    public void put(int key, int value) { }\n}',
    skills: ['Java', 'Data Structures', 'Design Patterns'],
    roles: ['Software Engineer', 'Senior Software Engineer'],
    minExperience: 3,
  },
  {
    id: 'fallback-3',
    topic: 'DevSecOps',
    subtopic: 'CI/CD',
    question: 'How do you integrate security into a DevSecOps pipeline?',
    answer:
      '**DevSecOps** shifts security *left* — baking automated security checks into every stage of the CI/CD pipeline.\n\n' +
      '## Pipeline stages and tooling\n\n' +
      '| Stage | Control | Example Tools |\n|---|---|---|\n| Source | Pre-commit hooks, secret scanning | gitleaks, trufflehog |\n| Build | SAST, dependency scanning | SonarQube, Snyk |\n| Package | Image scanning | Trivy, Grype |\n| Deploy | IaC scanning, policy gates | OPA, tfsec |\n| Runtime | Container & runtime monitoring | Falco, Aqua |',
    type: 'CONCEPTUAL',
    skills: ['DevSecOps', 'CI/CD', 'Security'],
    roles: ['DevOps Engineer', 'Platform Engineer', 'Tech Lead'],
    minExperience: 7,
  },
];

function filterFallbackQuestions(filters?: {
  search?: string;
  role?: string;
  skill?: string;
  minExperience?: number;
}): AppQuestion[] {
  let result = [...FALLBACK_QUESTIONS];
  if (filters?.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    result = result.filter(q => q.question.toLowerCase().includes(term) || q.answer.toLowerCase().includes(term));
  }
  if (filters?.role?.trim()) {
    const role = filters.role.trim();
    result = result.filter(q => q.roles.includes(role));
  }
  if (filters?.skill?.trim()) {
    const skill = filters.skill.trim();
    result = result.filter(q => q.skills.includes(skill));
  }
  if (filters?.minExperience !== undefined && filters.minExperience > 0) {
    const exp = filters.minExperience;
    result = result.filter(q => q.minExperience <= exp);
  }
  return result;
}

export async function fetchQuestions(filters?: {
  search?: string;
  role?: string;
  skill?: string;
  minExperience?: number;
}): Promise<AppQuestion[]> {
  const queryParams = new URLSearchParams();
  
  if (filters?.search?.trim()) queryParams.append('search', filters.search.trim());
  if (filters?.role?.trim()) queryParams.append('role', filters.role.trim());
  if (filters?.skill?.trim()) queryParams.append('skill', filters.skill.trim());
  if (filters?.minExperience !== undefined && filters.minExperience > 0) {
    queryParams.append('experience', filters.minExperience.toString());
  }

  const query = queryParams.toString();
  const url = query ? `${API_BASE_URL}/questions?${query}` : `${API_BASE_URL}/questions`;
  
  const response = await apiFetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(errorData));
  }
  
  const data = await response.json() as ApiQuestion[];
  
  if (!Array.isArray(data) || data.length === 0) {
    return filterFallbackQuestions(filters);
  }
  
  return data.map(toQuestion);
}

export async function fetchAdminQuestions(): Promise<AppQuestion[]> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/questions`, {}, true);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(extractErrorMessage(errorData));
    }
    return (await response.json() as ApiQuestion[]).map(toQuestion);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch admin questions');
  }
}

export async function createQuestion(question: Omit<AppQuestion, 'id'>): Promise<AppQuestion> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    }, true);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(extractErrorMessage(errorData));
    }

    return toQuestion(await response.json() as ApiQuestion);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create question');
  }
}

export async function updateQuestion(id: string, question: Partial<AppQuestion>): Promise<AppQuestion> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    }, true);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(extractErrorMessage(errorData));
    }

    return toQuestion(await response.json() as ApiQuestion);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update question');
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/questions/${id}`, {
      method: 'DELETE',
    }, true);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(extractErrorMessage(errorData));
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete question');
  }
}

export async function fetchAllQuestions(): Promise<AppQuestion[]> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/questions`, {}, true);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(extractErrorMessage(errorData));
    }
    return (await response.json() as ApiQuestion[]).map(toQuestion);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch all questions');
  }
}

export async function batchInsertQuestions(questions: Omit<AppQuestion, 'id'>[]): Promise<AppQuestion[]> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/questions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questions),
    }, true);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(extractErrorMessage(errorData));
    }

    return (await response.json() as ApiQuestion[]).map(toQuestion);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to batch insert questions');
  }
}
