import * as XLSX from 'xlsx';
import { QUESTION_HEADERS, type Question, type QuestionInput, type QuestionType } from './types';

function parseList(raw: string) {
  if (!raw) return [];
  return raw.split(/[|,]/).map((value) => value.trim()).filter(Boolean);
}

export interface ParsedSpreadsheetResult {
  rows: QuestionInput[];
  errors: string[];
}

function asText(value: unknown) {
  return value === undefined || value === null ? '' : String(value).trim();
}

export function parseQuestionsXlsx(data: ArrayBuffer): ParsedSpreadsheetResult {
  const errors: string[] = [];
  const workbook = XLSX.read(data, { type: 'array', cellText: true, cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return { rows: [], errors: ['The workbook has no worksheets'] };

  const sheet = workbook.Sheets[firstSheet];
  const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const headerRow = (values[0] ?? []).map(asText);
  const columnIndex = new Map(headerRow.map((header, index) => [header, index]));
  const missing = ['topic', 'subtopic', 'question', 'answer'].filter((header) => !columnIndex.has(header));
  if (missing.length > 0) return { rows: [], errors: [`Missing required columns: ${missing.join(', ')}`] };

  const get = (row: unknown[], header: string) => asText(row[columnIndex.get(header) ?? -1]);
  const rows: QuestionInput[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const row = values[index];
    const rowNumber = index + 1;
    const topic = get(row, 'topic');
    const subtopic = get(row, 'subtopic');
    const question = get(row, 'question');
    const answer = get(row, 'answer');
    const typeValue = get(row, 'type').toUpperCase() || 'CONCEPTUAL';

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
      min_experience: Number(get(row, 'minExperience')) || 0,
    });
  }
  return { rows, errors };
}

export function downloadQuestionsXlsx(filename: string, questions: Question[]) {
  const rows = questions.map((question) => ({
    topic: question.topic,
    subtopic: question.subtopic,
    question: question.question,
    answer: question.answer,
    type: question.type,
    starterCode: question.starter_code ?? '',
    skills: question.skills.join('|'),
    roles: question.roles.join('|'),
    minExperience: question.min_experience,
  }));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...QUESTION_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Questions');
  XLSX.writeFile(workbook, filename);
}

export function downloadQuestionsTemplate(filename: string) {
  downloadQuestionsXlsx(filename, []);
}
