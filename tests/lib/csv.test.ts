import { describe, expect, it, vi, beforeEach } from 'vitest';
import { downloadCsv, parseList, parseQuestionsCsv, questionsToCsv } from '@/lib/csv';
import type { Question } from '@/lib/types';

describe('csv helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses list values using both separators', () => {
    expect(parseList(undefined)).toEqual([]);
    expect(parseList('Java|Spring, Docker')).toEqual(['Java', 'Spring', 'Docker']);
  });

  it('exports questions to CSV with joined skills and roles', () => {
    const questions: Question[] = [
      {
        id: '1',
        topic: 'Java',
        subtopic: 'Concurrency',
        question: 'What is a thread?',
        answer: 'Execution path',
        type: 'CONCEPTUAL',
        starter_code: null,
        skills: ['Java', 'JVM'],
        roles: ['Backend', 'Lead'],
        min_experience: 3,
        created_at: new Date().toISOString(),
      },
    ];

    const csv = questionsToCsv(questions);
    expect(csv).toContain('topic,subtopic,question,answer,type,starterCode,skills,roles,minExperience');
    expect(csv).toContain('Java|JVM');
    expect(csv).toContain('Backend|Lead');
  });

  it('downloads csv by creating and clicking a link', () => {
    const createObjectURL = vi.fn(() => 'blob:test-url');
    const revokeObjectURL = vi.fn(() => undefined);
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true });

    const createUrlSpy = vi.spyOn(URL, 'createObjectURL');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL');
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadCsv('questions.csv', 'topic,subtopic\nJava,Concurrency');

    expect(createUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(revokeUrlSpy).toHaveBeenCalledWith('blob:test-url');
  });

  it('returns error when required headers are missing', () => {
    const input = 'topic,question,answer\nJava,Q,A';
    const parsed = parseQuestionsCsv(input);

    expect(parsed.rows).toEqual([]);
    expect(parsed.errors[0]).toContain('Missing required CSV headers');
  });

  it('handles malformed rows where answer contains unquoted commas', () => {
    const input = [
      'topic,subtopic,question,answer,type,starterCode,skills,roles,minExperience',
      'Java,Collections,What is HashMap?,Average case, O(1),CODING,const x=1,Java|Collections,Backend|Lead,4',
    ].join('\n');

    const parsed = parseQuestionsCsv(input);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      answer: 'Average case, O(1)',
      type: 'CODING',
      skills: ['Java', 'Collections'],
      roles: ['Backend', 'Lead'],
      min_experience: 4,
    });
  });

  it('adds row errors for invalid type values', () => {
    const input = [
      'topic,subtopic,question,answer,type,starterCode,skills,roles,minExperience',
      'Java,Collections,What is HashMap?,A map,INVALID,,Java,Backend,2',
    ].join('\n');

    const parsed = parseQuestionsCsv(input);

    expect(parsed.rows).toEqual([]);
    expect(parsed.errors[0]).toContain('missing required field value');
  });
});
