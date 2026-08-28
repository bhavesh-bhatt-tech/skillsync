import type { Meta, StoryObj } from '@storybook/react';
import { QuestionCard } from './QuestionCard';
import type { Question } from '@/lib/types';

const baseQuestion: Question = {
  id: 'story-question',
  topic: 'Java',
  subtopic: 'Concurrency',
  question: 'How do virtual threads improve application throughput?',
  answer: 'Virtual threads are lightweight threads managed by the JVM.\n\n```java\npublic class Example {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}\n```',
  type: 'CONCEPTUAL',
  starter_code: null,
  skills: ['Java', 'Concurrency'],
  roles: ['Backend Engineer'],
  min_experience: 3,
  created_at: new Date(0).toISOString(),
};

const meta = {
  title: 'Components/QuestionCard',
  component: QuestionCard,
  tags: ['autodocs'],
} satisfies Meta<typeof QuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Conceptual: Story = {
  args: { question: baseQuestion },
};

export const Coding: Story = {
  args: {
    question: {
      ...baseQuestion,
      id: 'story-coding',
      type: 'CODING',
      question: 'Implement a thread-safe counter.',
      starter_code: 'class Counter {\n  int value;\n}',
    },
  },
};

export const EmptyMetadata: Story = {
  args: {
    question: { ...baseQuestion, roles: [], skills: [], min_experience: 0 },
  },
};
