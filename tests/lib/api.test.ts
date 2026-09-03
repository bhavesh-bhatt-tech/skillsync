import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchQuestions, fetchAdminQuestions, createQuestion, updateQuestion, deleteQuestion, batchInsertQuestions } from '@/lib/api';

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('fetches questions successfully without filters', async () => {
    const mockData = [
      {
        id: '1',
        topic: 'React',
        subtopic: 'Hooks',
        question: 'What is useState?',
        answer: 'State hook',
        type: 'CONCEPTUAL',
        skills: ['React'],
        roles: ['Frontend'],
        minExperience: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await fetchQuestions();
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe('React');
    expect(result[0].minExperience).toBe(1);
  });

  it('fetches questions with search and filter parameters', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await fetchQuestions({ search: 'useState', role: 'Frontend', skill: 'React', minExperience: 2 });
    expect(result).toEqual([]);
    const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchCall).toContain('search=useState');
    expect(fetchCall).toContain('role=Frontend');
    expect(fetchCall).toContain('skill=React');
    expect(fetchCall).toContain('experience=2');
  });

  it('throws error when fetchQuestions fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Database error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    );

    await expect(fetchQuestions()).rejects.toThrow('Database error');
  });

  it('fetches admin questions successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await fetchAdminQuestions();
    expect(result).toEqual([]);
  });

  it('creates a question successfully', async () => {
    const created = {
      id: '2',
      topic: 'Node',
      subtopic: 'Express',
      question: 'What is express?',
      answer: 'Web framework',
      type: 'CONCEPTUAL',
      skills: ['Node'],
      roles: ['Backend'],
      minExperience: 2,
      createdAt: new Date().toISOString(),
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await createQuestion({
      topic: 'Node',
      subtopic: 'Express',
      question: 'What is express?',
      answer: 'Web framework',
      type: 'CONCEPTUAL',
      starterCode: null,
      skills: ['Node'],
      roles: ['Backend'],
      minExperience: 2,
    });

    expect(result.id).toBe('2');
  });

  it('updates a question successfully', async () => {
    const updated = {
      id: '2',
      topic: 'Node',
      subtopic: 'Express',
      question: 'Updated?',
      answer: 'Updated answer',
      type: 'CONCEPTUAL',
      skills: ['Node'],
      roles: ['Backend'],
      minExperience: 2,
      createdAt: new Date().toISOString(),
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await updateQuestion('2', {
      topic: 'Node',
      subtopic: 'Express',
      question: 'Updated?',
      answer: 'Updated answer',
      type: 'CONCEPTUAL',
      starterCode: null,
      skills: ['Node'],
      roles: ['Backend'],
      minExperience: 2,
    });

    expect(result.question).toBe('Updated?');
  });

  it('deletes a question successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    await expect(deleteQuestion('2')).resolves.toBeUndefined();
  });

  it('batch inserts questions successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify([
        {
          id: '10',
          topic: 'A',
          subtopic: 'B',
          question: 'C',
          answer: 'D',
          type: 'CONCEPTUAL',
          starterCode: null,
          skills: [],
          roles: [],
          minExperience: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const result = await batchInsertQuestions([
      {
        topic: 'A',
        subtopic: 'B',
        question: 'C',
        answer: 'D',
        type: 'CONCEPTUAL',
        starterCode: null,
        skills: [],
        roles: [],
        minExperience: 0,
      },
    ]);
    expect(result).toHaveLength(1);
  });
});
