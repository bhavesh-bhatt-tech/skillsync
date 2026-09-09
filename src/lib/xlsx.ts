import * as XLSX from 'xlsx';
const { read } = XLSX;
import { type Question } from './types';
export interface QuestionInput {
  topic: string;
  subtopic: string;
  question: string;
  answer: string;
  type: 'CONCEPTUAL' | 'PRACTICAL' | 'SYSTEM_DESIGN' | 'CODING';
  starter_code: string | null;
  skills: string[];
  roles: string[];
  min_experience: number;
}

export interface ParsedSpreadsheetResult {
  rows: QuestionInput[];
  errors: string[];
}

type QuestionType = 'CONCEPTUAL' | 'PRACTICAL' | 'SYSTEM_DESIGN' | 'CODING';



// FIX: Utility function for safe column access
function asText(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value).trim();
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).trim();
}

function parseList(value: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function downloadQuestionsXlsx(filename: string, questions: Question[]) {
  const formattedQuestions = questions.map(q => ({
    topic: q.topic,
    subtopic: q.subtopic,
    question: q.question,
    answer: q.answer,
    type: q.type,
    starterCode: q.starter_code,
    skills: q.skills.join(', '),
    roles: q.roles.join(', '),
    minExperience: q.min_experience,
  }));
  const ws = XLSX.utils.json_to_sheet(formattedQuestions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  XLSX.writeFile(wb, filename);
}

export function downloadQuestionsTemplate(filename: string) {
  const headers = [['topic', 'subtopic', 'question', 'answer', 'type', 'starterCode', 'skills', 'roles', 'minExperience']];
  const ws = XLSX.utils.aoa_to_sheet(headers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, filename);
}

export function parseQuestionsXlsx(data: ArrayBuffer): ParsedSpreadsheetResult {
  const errors: string[] = [];
  
  try {
    const workbook = read(data, { type: 'array', cellText: true, cellDates: true });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) return { rows: [], errors: ['The workbook has no worksheets'] };

    const sheet = workbook.Sheets[firstSheet];
    if (!sheet) return { rows: [], errors: ['Failed to read worksheet'] };

    const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    if (!Array.isArray(values) || values.length === 0) {
      return { rows: [], errors: ['Worksheet is empty'] };
    }

    const headerRow = (values[0] ?? []).map(asText);
    const columnIndex = new Map(headerRow.map((header, index) => [header, index]));
    const missing = ['topic', 'subtopic', 'question', 'answer'].filter((header) => !columnIndex.has(header));
    if (missing.length > 0) return { rows: [], errors: [`Missing required columns: ${missing.join(', ')}`] };

    // FIX: Utility function for safe column access
    const get = (row: unknown[], header: string): string => {
      const idx = columnIndex.get(header);
      return idx !== undefined ? asText(row[idx]) : '';
    };

    const rows: QuestionInput[] = [];
    for (let index = 1; index < values.length; index += 1) {
      const row = values[index];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rowNumber = index + 1;
      const topic = get(row, 'topic').trim();
      const subtopic = get(row, 'subtopic').trim();
      const question = get(row, 'question').trim();
      const answer = get(row, 'answer').trim();
      const typeValue = get(row, 'type').trim().toUpperCase() || 'CONCEPTUAL';

      if (!topic || !subtopic || !question || !answer) {
        errors.push(`Row ${rowNumber}: missing required field value`);
        continue;
      }

      rows.push({
        topic,
        subtopic,
        question,
        answer,
        type: typeValue as QuestionType,
        starter_code: get(row, 'starterCode') || null,
        skills: parseList(get(row, 'skills')),
        roles: parseList(get(row, 'roles')),
        min_experience: Math.max(0, Number(get(row, 'minExperience')) || 0),
      });
    }
    return { rows, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing file';
    return { rows: [], errors: [`Failed to parse spreadsheet: ${message}`] };
  }
}