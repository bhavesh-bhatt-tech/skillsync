import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { parseQuestionsXlsx } from './xlsx';

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
      skills: 'Docker|Linux',
      roles: 'Platform Engineer',
    }]));

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({ type: 'PLATFORM-ENGINEERING', skills: ['Docker', 'Linux'] });
  });
});
