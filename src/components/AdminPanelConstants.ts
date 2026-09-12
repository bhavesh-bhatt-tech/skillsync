export const PAGE_SIZE = 10;
export const MAX_EXPERIENCE = 30;
export const QUESTION_TYPES = {
  CONCEPTUAL: 'CONCEPTUAL',
  CODING: 'CODING',
  SYSTEM_DESIGN: 'SYSTEM-DESIGN',
} as const;

export const ERROR_MESSAGES = {
  INVALID_XLSX: 'Please upload an .xlsx file',
  EMPTY_FILE: 'The uploaded file is empty',
  REQUIRED_FIELDS: 'Topic, subtopic, question, and answer are all required',
  EXPORT_EMPTY: 'No questions to export',
} as const;
