import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionCard } from '@/components/QuestionCard';
import type { Question } from '@/lib/types';

describe('QuestionCard', () => {
  const conceptualQuestion: Question = {
    id: '1',
    topic: 'React',
    subtopic: 'Hooks',
    question: 'What is useEffect?',
    answer: 'A side effect hook.',
    type: 'CONCEPTUAL',
    starter_code: null,
    skills: ['React'],
    roles: ['Frontend'],
    min_experience: 2,
    created_at: new Date().toISOString(),
  };

  const codingQuestion: Question = {
    id: '2',
    topic: 'TypeScript',
    subtopic: 'Generics',
    question: 'Write an identity function.',
    answer: 'function identity<T>(arg: T): T { return arg; }',
    type: 'CODING',
    starter_code: 'function identity<T>(arg: T): T { return arg; }',
    skills: ['TypeScript'],
    roles: ['Fullstack'],
    min_experience: 3,
    created_at: new Date().toISOString(),
  };

  it('renders conceptual question card', () => {
    render(<QuestionCard question={conceptualQuestion} />);
    expect(screen.getByText('Conceptual')).toBeInTheDocument();
    expect(screen.getByText('What is useEffect?')).toBeInTheDocument();
    expect(screen.getByText('React / Hooks')).toBeInTheDocument();
    expect(screen.getByText('Min exp: 2+ yrs')).toBeInTheDocument();
  });

  it('renders coding challenge question card', () => {
    render(<QuestionCard question={codingQuestion} />);
    expect(screen.getByText('Coding Challenge')).toBeInTheDocument();
    expect(screen.getByText('Write an identity function.')).toBeInTheDocument();
    expect(screen.getByText('TypeScript / Generics')).toBeInTheDocument();
    expect(screen.getByText('Min exp: 3+ yrs')).toBeInTheDocument();
  });
});
