import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseQuestionsXlsx } from '@/lib/xlsx';

function workbookBuffer(rows: Record<string, string>[]) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Questions');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

describe('parseQuestionsXlsx', () => {
  it('parses valid questions and preserves arbitrary types', () => {
    const result = parseQuestionsXlsx(workbookBuffer([{
      topic: 'Cloud & DevOps',
      subtopic: 'Containers',
      question: 'What is a container?',
      answer: 'An isolated process.',
      type: 'PLATFORM-ENGINEERING',
      skills: 'Docker,Linux',
      roles: 'Platform Engineer',
    }]));

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({ type: 'PLATFORM-ENGINEERING', skills: ['Docker', 'Linux'] });
  });

  it('reports missing required columns', () => {
    const result = parseQuestionsXlsx(workbookBuffer([{ topic: 'A', subtopic: 'B' }]));

    expect(result.rows).toEqual([]);
    expect(result.errors[0]).toContain('Missing required columns');
  });

  it('collects row level errors for incomplete rows', () => {
    const result = parseQuestionsXlsx(workbookBuffer([{
      topic: 'Cloud',
      subtopic: '',
      question: 'Q',
      answer: 'A',
      type: 'conceptual',
    }]));

    expect(result.rows).toEqual([]);
    expect(result.errors[0]).toContain('missing required field value');
  });

  it('normalizes minExperience and starterCode fields', () => {
    const result = parseQuestionsXlsx(workbookBuffer([{
      topic: 'Cloud',
      subtopic: 'Kubernetes',
      question: 'What is a pod?',
      answer: 'Smallest deployable unit.',
      type: 'conceptual',
      minExperience: '-10',
      starterCode: '',
      skills: 'k8s; docker',
      roles: 'platform; sre',
    }]));
    console.log('ACTUAL RESULT ROW:', JSON.stringify(result.rows[0], null, 2));

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      minExperience: 0,
      starterCode: null,
      skills: ['k8s', 'docker'],
      roles: ['platform', 'sre'],
      type: 'CONCEPTUAL',
    });
  });
});
