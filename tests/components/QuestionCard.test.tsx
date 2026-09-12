import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QuestionCard } from '@/components/QuestionCard';
import type { Question } from '@/lib/types';

describe('QuestionCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const conceptualQuestion: Question = {
    id: '1',
    topic: 'React',
    subtopic: 'Hooks',
    question: 'What is useEffect?',
    answer: 'A side effect hook.',
    type: 'CONCEPTUAL',
    starterCode: null,
    skills: ['React'],
    roles: ['Frontend'],
    minExperience: 2,
    createdAt: new Date().toISOString(),
  };

  const codingQuestion: Question = {
    id: '2',
    topic: 'TypeScript',
    subtopic: 'Generics',
    question: 'Write an identity function.',
    answer: 'function identity<T>(arg: T): T { return arg; }',
    type: 'CODING',
    starterCode: 'function identity<T>(arg: T): T { return arg; }',
    skills: ['TypeScript'],
    roles: ['Fullstack'],
    minExperience: 3,
    createdAt: new Date().toISOString(),
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

  it('copies coding answer with clipboard api', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<QuestionCard question={codingQuestion} />);
    const copyButton = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(copyButton);

    expect(await screen.findByText('Copied')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(codingQuestion.answer);
  });

  it('uses fallback copy when clipboard api is unavailable', async () => {
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(Document.prototype, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    render(<QuestionCard question={codingQuestion} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByText('Copied', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('handles copy errors without breaking ui', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<QuestionCard question={codingQuestion} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByText('Copy')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
