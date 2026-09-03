import { useEffect, useRef, useState, useCallback, useId, type RefObject, type DragEvent } from 'react';
import {
  Plus, Save, X, UploadCloud, FileDown, Trash2, Pencil, Loader2, FileSpreadsheet, ChevronLeft, ChevronRight,
  Bold, Italic, Heading2, Code2,
} from 'lucide-react';
import type { Question, QuestionInput, QuestionType } from '@/lib/types';
import {
  batchInsertQuestions, createQuestion, deleteQuestion, fetchAllQuestions, updateQuestion,
} from '@/lib/api';
import { downloadQuestionsTemplate, downloadQuestionsXlsx, parseQuestionsXlsx } from '@/lib/xlsx';
import { useToast } from './Toast';

interface AdminPanelProps {
  questions: Question[];
  loading: boolean;
  editing: Question | null;
  onQuestionsChanged: () => void;
  onStartEdit: (q: Question) => void;
  onCancelEdit: () => void;
}

export function AdminPanel(props: Readonly<AdminPanelProps>) {
  const { questions, loading, editing, onQuestionsChanged, onStartEdit, onCancelEdit } = props;
  const { notify } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const pageCount = Math.max(1, Math.ceil(questions.length / 10));
  const visibleQuestions = questions.slice((page - 1) * 10, page * 10);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);



  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      notify('error', 'Please upload an .xlsx file');
      return;
    }
    if (file.size === 0) {
      notify('error', 'The uploaded file is empty');
      return;
    }
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const { rows, errors } = parseQuestionsXlsx(data);
      if (errors.length > 0) {
        notify('error', `Spreadsheet errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ' …' : ''}`);
        if (rows.length === 0) { setImporting(false); return; }
      }
      const payload = rows.map((r) => ({
        topic: r.topic,
        subtopic: r.subtopic,
        question: r.question,
        answer: r.answer,
        type: r.type,
        starterCode: r.starter_code ?? null,
        skills: r.skills,
        roles: r.roles,
        minExperience: r.min_experience,
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

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); }, [setDragOver]);
  const onDragLeave = useCallback(() => setDragOver(false), [setDragOver]);
  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleChooseFile = useCallback(() => fileRef.current?.click(), []);
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  }, [handleFile]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const all = await fetchAllQuestions();
      if (all.length === 0) { notify('info', 'No questions to export'); return; }
      downloadQuestionsXlsx('questions.xlsx', all);
      notify('success', `Exported ${all.length} question${all.length === 1 ? '' : 's'}`);
    } catch (e) {
      notify('error', `Export failed: ${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [notify]);

  const handleDelete = useCallback(async (q: Question) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm(`Delete "${q.question}"?`) : true;
    if (!confirmed) return;
    try {
      await deleteQuestion(q.id);
      notify('success', 'Question deleted');
      onQuestionsChanged();
    } catch (e) {
      notify('error', `Delete failed: ${(e as Error).message}`);
    }
  }, [notify, onQuestionsChanged]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <QuestionForm
          key={editing?.id ?? 'new'}
          editing={editing}
          onSaved={() => { onQuestionsChanged(); onCancelEdit(); }}
          onCancel={onCancelEdit}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Spreadsheet Portal</h3>
          <p className="mb-4 text-xs text-slate-400">
            Columns: topic, subtopic, question, answer, type, starterCode, skills, roles, minExperience
          </p>
          <div
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
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Export XLSX
            </button>
            <button
              onClick={() => downloadQuestionsTemplate('questions-template.xlsx')}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
            >
              <FileSpreadsheet className="h-4 w-4" /> Download XLSX template
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Manage Questions · Total: {questions.length}
          </h3>
          <div className="space-y-1.5">
            {loading && <p className="text-sm text-slate-400">Loading questions...</p>}
            {!loading && questions.length === 0 && <p className="text-sm text-slate-400">No questions yet.</p>}
            {!loading && visibleQuestions.map((q) => (
              <div
                key={q.id}
                className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
              >
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    q.type === 'CODING' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {q.type === 'CODING' ? 'CODE' : 'Q'}
                </span>
                <span className="flex-1 truncate text-sm text-slate-700">{q.question}</span>
                <button
                  type="button"
                  aria-label="Edit question"
                  title="Edit"
                  onClick={() => onStartEdit(q)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-sky-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Delete question"
                  title="Delete"
                  onClick={() => handleDelete(q)}
                  className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {!loading && pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-600">
              <button type="button" aria-label="Previous page" title="Previous page" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-300 bg-white p-1.5 hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {page} of {pageCount}</span>
              <button type="button" aria-label="Next page" title="Next page" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-300 bg-white p-1.5 hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FormattingToolbar(props: Readonly<{
  inputRef: RefObject<HTMLTextAreaElement>;
  onChange: (value: string) => void;
}>) {
  const { inputRef, onChange } = props;
  const applyFormat = (prefix: string, suffix: string, placeholder: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end) || placeholder;
    const nextValue = `${input.value.slice(0, start)}${prefix}${selected}${suffix}${input.value.slice(end)}`;
    onChange(nextValue);
    requestAnimationFrame(() => {
      input.focus();
      const selectionStart = start + prefix.length;
      input.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  };

  const buttonClass = 'rounded border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700';

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <button type="button" title="Bold" aria-label="Bold" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('**', '**', 'bold text')}>
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" title="Italic" aria-label="Italic" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('*', '*', 'italic text')}>
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" title="Heading size" aria-label="Heading size" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('## ', '', 'Heading')}>
        <Heading2 className="h-4 w-4" />
      </button>
      <button type="button" title="Code" aria-label="Code" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('`', '`', 'code')}>
        <Code2 className="h-4 w-4" />
      </button>
      <button type="button" title="Code block" aria-label="Code block" className={`${buttonClass} text-xs`} onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat('```\n', '\n```', 'code block')}>
        {'{ }'}
      </button>
    </div>
  );
}

function QuestionForm(props: Readonly<{ editing: Question | null; onSaved: () => void; onCancel: () => void }>) {
  const { editing, onSaved, onCancel } = props;
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<QuestionInput>({
    topic: editing?.topic ?? '',
    subtopic: editing?.subtopic ?? '',
    question: editing?.question ?? '',
    answer: editing?.answer ?? '',
    type: editing?.type ?? 'CONCEPTUAL',
    starter_code: editing?.starter_code ?? '',
    skills: editing?.skills ?? [],
    roles: editing?.roles ?? [],
    min_experience: editing?.min_experience ?? 0,
  });
  const [skillsText, setSkillsText] = useState(form.skills.join(', '));
  const [rolesText, setRolesText] = useState(form.roles.join(', '));
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();

  const set = <K extends keyof QuestionInput>(k: K, v: QuestionInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.topic.trim() || !form.subtopic.trim() || !form.question.trim() || !form.answer.trim()) {
      notify('error', 'Topic, subtopic, question, and answer are all required');
      return;
    }
    const apiPayload = {
      topic: form.topic,
      subtopic: form.subtopic,
      question: form.question,
      answer: form.answer,
      type: form.type as any,
      starterCode: form.type === 'CODING' ? form.starter_code ?? null : null,
      skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
      roles: rolesText.split(',').map((s) => s.trim()).filter(Boolean),
      minExperience: form.min_experience,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateQuestion(editing.id, apiPayload);
        notify('success', 'Question updated');
      } else {
        await createQuestion(apiPayload);
        notify('success', 'Question created');
      }
      onSaved();
    } catch (e) {
      notify('error', `Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editing ? 'Edit Question' : 'Add Question'}
        </h3>
        {editing && (
          <button onClick={onCancel} className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600">
            <X className="h-3.5 w-3.5" /> Cancel edit
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-topic`} className="mb-1 block text-xs font-medium text-slate-500">Topic *</label>
          <input id={`${id}-topic`} className={inputCls} value={form.topic} onChange={(e) => set('topic', e.target.value)} placeholder="e.g. Java" />
        </div>
        <div>
          <label htmlFor={`${id}-subtopic`} className="mb-1 block text-xs font-medium text-slate-500">Subtopic *</label>
          <input id={`${id}-subtopic`} className={inputCls} value={form.subtopic} onChange={(e) => set('subtopic', e.target.value)} placeholder="e.g. Concurrency" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-question`} className="mb-1 block text-xs font-medium text-slate-500">question *</label>
          <FormattingToolbar inputRef={questionRef} onChange={(value) => set('question', value)} />
          <textarea id={`${id}-question`} ref={questionRef} className={`${inputCls} min-h-[72px] rounded-t-none`} value={form.question} onChange={(e) => set('question', e.target.value)} placeholder="Question question" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-answer`} className="mb-1 block text-xs font-medium text-slate-500">Answer (Markdown) *</label>
          <FormattingToolbar inputRef={answerRef} onChange={(value) => set('answer', value)} />
          <textarea
            id={`${id}-answer`}
            ref={answerRef}
            className={`${inputCls} min-h-[140px] rounded-t-none font-mono text-xs`}
            value={form.answer}
            onChange={(e) => set('answer', e.target.value)}
            placeholder="**Bold**, code blocks, tables supported…"
          />
        </div>
        <div>
          <label htmlFor={`${id}-type`} className="mb-1 block text-xs font-medium text-slate-500">Type</label>
          <input
            id={`${id}-type`}
            className={inputCls}
            value={form.type}
            onChange={(e) => set('type', e.target.value as QuestionType)}
            placeholder="e.g. CONCEPTUAL, CODING, SYSTEM-DESIGN"
          />
        </div>
        <div>
          <label htmlFor={`${id}-minExperience`} className="mb-1 block text-xs font-medium text-slate-500">Min Experience (yrs)</label>
          <input
            id={`${id}-minExperience`}
            type="number" min={0} max={30}
            className={inputCls}
            value={form.min_experience}
            onChange={(e) => set('min_experience', Number(e.target.value) || 0)}
          />
        </div>
        {form.type === 'CODING' && (
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-starter`} className="mb-1 block text-xs font-medium text-slate-500">Starter Code</label>
            <textarea
              id={`${id}-starter`}
              className={`${inputCls} min-h-[120px] font-mono text-xs`}
              value={form.starter_code ?? ''}
              onChange={(e) => set('starter_code', e.target.value)}
              placeholder="// starter code…"
            />
          </div>
        )}
        <div>
          <label htmlFor={`${id}-skills`} className="mb-1 block text-xs font-medium text-slate-500">Skills (comma-separated)</label>
          <input id={`${id}-skills`} className={inputCls} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="Java 21, Spring Boot" />
        </div>
        <div>
          <label htmlFor={`${id}-roles`} className="mb-1 block text-xs font-medium text-slate-500">Roles (comma-separated)</label>
          <input id={`${id}-roles`} className={inputCls} value={rolesText} onChange={(e) => setRolesText(e.target.value)} placeholder="Tech Lead, Software Architect" />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={saving}
        className="mt-5 flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {editing ? 'Update' : 'Create'} Question
      </button>
    </section>
  );
}
