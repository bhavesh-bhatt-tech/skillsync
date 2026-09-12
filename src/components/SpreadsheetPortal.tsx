import { useRef, useState, useCallback, type DragEvent } from 'react';
import { UploadCloud, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { downloadQuestionsTemplate, downloadQuestionsXlsx, parseQuestionsXlsx } from '@/lib/xlsx';
import { batchInsertQuestions, fetchAllQuestions } from '@/lib/api';
import { useToast } from './Toast';
import { ERROR_MESSAGES } from './AdminPanelConstants';

interface SpreadsheetPortalProps {
  readonly onQuestionsChanged: () => void;
}

export function SpreadsheetPortal({ onQuestionsChanged }: SpreadsheetPortalProps) {
  const { notify } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      notify('error', ERROR_MESSAGES.INVALID_XLSX);
      return;
    }
    if (file.size === 0) {
      notify('error', ERROR_MESSAGES.EMPTY_FILE);
      return;
    }
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const { rows, errors } = parseQuestionsXlsx(data);
      if (errors.length > 0) {
        notify('error', `Spreadsheet errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ' …' : ''}`);
        if (rows.length === 0) {
          setImporting(false);
          return;
        }
      }
      const payload = rows.map((r) => ({
        topic: r.topic,
        subtopic: r.subtopic,
        question: r.question,
        answer: r.answer,
        type: r.type,
        starterCode: r.starterCode ?? null,
        skills: r.skills,
        roles: r.roles,
        minExperience: r.minExperience,
      }));

      const result = await batchInsertQuestions(payload);
      notify('success', `Imported ${result.length} question${result.length === 1 ? '' : 's'}`);
      onQuestionsChanged();
    } catch (e) {
      notify('error', `Import failed: ${(e as Error).message}`);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [notify, onQuestionsChanged]);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);
  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleChooseFile = useCallback(() => fileRef.current?.click(), []);
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const all = await fetchAllQuestions();
      if (all.length === 0) {
        notify('info', ERROR_MESSAGES.EXPORT_EMPTY);
        return;
      }
      downloadQuestionsXlsx('questions.xlsx', all);
      notify('success', `Exported ${all.length} question${all.length === 1 ? '' : 's'}`);
    } catch (e) {
      notify('error', `Export failed: ${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [notify]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Spreadsheet Portal</h3>
      <p className="mb-4 text-xs text-slate-400">
        Columns: topic, subtopic, question, answer, type, starterCode, skills, roles, minExperience
      </p>
      <div
        role="region"
        aria-label="File upload dropzone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        {importing ? (
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        ) : (
          <UploadCloud className="h-8 w-8 text-slate-400" />
        )}
        <p className="mt-3 text-sm font-medium text-slate-700">
          {importing ? 'Importing…' : 'Drag & drop a single .xlsx file here'}
        </p>
        <p className="text-xs text-slate-400">or</p>
        <button
          type="button"
          onClick={handleChooseFile}
          disabled={importing}
          className="mt-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          Choose file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileInputChange}
          aria-label="Upload questions spreadsheet"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Export XLSX
        </button>
        <button
          type="button"
          onClick={() => downloadQuestionsTemplate('questions-template.xlsx')}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
        >
          <FileSpreadsheet className="h-4 w-4" /> Download XLSX template
        </button>
      </div>
    </section>
  );
}
