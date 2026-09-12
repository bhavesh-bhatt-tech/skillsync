import Papa from 'papaparse';
import {
  QUESTION_HEADERS,
  REQUIRED_CSV_HEADERS,
  type Question,
  type QuestionInput,
} from './types';

export function parseList(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function questionsToCsv(questions: Question[]): string {
  const rows = questions.map((q) => ({
    topic: q.topic,
    subtopic: q.subtopic,
    question: q.question,
    answer: q.answer,
    type: q.type,
    starterCode: q.starterCode ?? '',
    skills: q.skills.join('|'),
    roles: q.roles.join('|'),
    minExperience: q.minExperience,
  }));
  return Papa.unparse({ fields: [...QUESTION_HEADERS], data: rows });
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface ParsedCsvResult {
  rows: QuestionInput[];
  errors: string[];
}

type ParsedCsvRow = Record<string, string> & { __parsed_extra?: string[] };

function normalizeRow(raw: ParsedCsvRow) {
  const shiftedFields = [
    raw.type,
    raw.starterCode,
    raw.skills,
    raw.roles,
    raw.minExperience,
    ...(raw.__parsed_extra ?? []),
  ];
  const typeIndex = shiftedFields.findIndex((value) => {
    const normalized = value?.trim().toUpperCase();
    return normalized === 'CONCEPTUAL' || normalized === 'CODING';
  });

  if (typeIndex < 0) return null;

  const type = shiftedFields[typeIndex].trim().toUpperCase();
  const optionalFields = shiftedFields.slice(typeIndex + 1);
  return {
    answer: [raw.answer, ...shiftedFields.slice(0, typeIndex)].filter(Boolean).join(',').trim(),
    type,
    starterCode: optionalFields[0],
    skills: optionalFields[1],
    roles: optionalFields[2],
    minExperience: optionalFields[3],
  };
}

export function parseQuestionsCsv(text: string): ParsedCsvResult {
  const errors: string[] = [];
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  }) as Papa.ParseResult<ParsedCsvRow>;

  const headers = result.meta.fields ?? [];
  const missing = REQUIRED_CSV_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    errors.push(`Missing required CSV headers: ${missing.join(', ')}`);
    return { rows: [], errors };
  }

  const rows: QuestionInput[] = [];
  for (const [i, raw] of result.data.entries()) {
    const rowNum = i + 2;
    const topic = raw.topic?.trim();
    const subtopic = raw.subtopic?.trim();
    const question = raw.question?.trim();
    const normalized = normalizeRow(raw);
    const answer = normalized?.answer;
    const typeRaw = normalized?.type;

    if (!topic || !subtopic || !question || !answer) {
      errors.push(`Row ${rowNum}: missing required field value`);
      continue;
    }
    if (!typeRaw) {
      errors.push(`Row ${rowNum}: invalid type "${raw.type}" (must be CONCEPTUAL or CODING)`);
      continue;
    }

    rows.push({
      topic,
      subtopic,
      question,
      answer,
      type: typeRaw,
      starterCode: normalized.starterCode?.trim() || null,
      skills: parseList(normalized.skills),
      roles: parseList(normalized.roles),
      minExperience: Number(normalized.minExperience) || 0,
    });
  }

  return { rows, errors };
}
