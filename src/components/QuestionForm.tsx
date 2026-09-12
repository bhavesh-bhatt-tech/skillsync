import { useState, useRef, useId } from 'react';
import { Plus, Save, X, Pencil, Loader2 } from 'lucide-react';
import type { Question, QuestionInput } from '@/lib/types';
import { createQuestion, updateQuestion } from '@/lib/api';
import { useToast } from './Toast';
import { FormattingToolbar } from './FormattingToolbar';
import { MAX_EXPERIENCE, QUESTION_TYPES, ERROR_MESSAGES } from './AdminPanelConstants';

interface QuestionFormProps {
  readonly editing: Question | null;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}

export function QuestionForm({ editing, onSaved, onCancel }: QuestionFormProps) {
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<QuestionInput>({
    topic: editing?.topic ?? '',
    subtopic: editing?.subtopic ?? '',
    question: editing?.question ?? '',
    answer: editing?.answer ?? '',
    type: editing?.type ?? QUESTION_TYPES.CONCEPTUAL,
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

  const setField = <K extends keyof QuestionInput>(k: K, v: QuestionInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.topic.trim() || !form.subtopic.trim() || !form.question.trim() || !form.answer.trim()) {
      notify('error', ERROR_MESSAGES.REQUIRED_FIELDS);
      return;
    }
    const apiPayload = {
      topic: form.topic,
      subtopic: form.subtopic,
      question: form.question,
      answer: form.answer,
      type: form.type as never,
      starterCode: form.type === QUESTION_TYPES.CODING ? form.starter_code ?? null : null,
      skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
      roles: rolesText.split(',').map((r) => r.trim()).filter(Boolean),
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
          <button type="button" onClick={onCancel} className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600">
            <X className="h-3.5 w-3.5" /> Cancel edit
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-topic`} className="mb-1 block text-xs font-medium text-slate-500">Topic *</label>
          <input id={`${id}-topic`} className={inputCls} value={form.topic} onChange={(e) => setField('topic', e.target.value)} placeholder="e.g. Java" />
        </div>
        <div>
          <label htmlFor={`${id}-subtopic`} className="mb-1 block text-xs font-medium text-slate-500">Subtopic *</label>
          <input id={`${id}-subtopic`} className={inputCls} value={form.subtopic} onChange={(e) => setField('subtopic', e.target.value)} placeholder="e.g. Concurrency" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-question`} className="mb-1 block text-xs font-medium text-slate-500">Question *</label>
          <FormattingToolbar inputRef={questionRef} onChange={(value) => setField('question', value)} />
          <textarea id={`${id}-question`} ref={questionRef} className={`${inputCls} min-h-[72px] rounded-t-none`} value={form.question} onChange={(e) => setField('question', e.target.value)} placeholder="Question question" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-answer`} className="mb-1 block text-xs font-medium text-slate-500">Answer (Markdown) *</label>
          <FormattingToolbar inputRef={answerRef} onChange={(value) => setField('answer', value)} />
          <textarea
            id={`${id}-answer`}
            ref={answerRef}
            className={`${inputCls} min-h-[140px] rounded-t-none font-mono text-xs`}
            value={form.answer}
            onChange={(e) => setField('answer', e.target.value)}
            placeholder="**Bold**, code blocks, tables supported…"
          />
        </div>
        <div>
          <label htmlFor={`${id}-type`} className="mb-1 block text-xs font-medium text-slate-500">Type</label>
          <input
            id={`${id}-type`}
            className={inputCls}
            value={form.type}
            onChange={(e) => setField('type', e.target.value)}
            placeholder="e.g. CONCEPTUAL, CODING, SYSTEM-DESIGN"
          />
        </div>
        <div>
          <label htmlFor={`${id}-minExperience`} className="mb-1 block text-xs font-medium text-slate-500">Min Experience (yrs)</label>
          <input
            id={`${id}-minExperience`}
            type="number" min={0} max={MAX_EXPERIENCE}
            className={inputCls}
            value={form.min_experience}
            onChange={(e) => setField('min_experience', Number(e.target.value) || 0)}
          />
        </div>
        {form.type === QUESTION_TYPES.CODING && (
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-starter`} className="mb-1 block text-xs font-medium text-slate-500">Starter Code</label>
            <textarea
              id={`${id}-starter`}
              className={`${inputCls} min-h-[120px] font-mono text-xs`}
              value={form.starterCode ?? ''}
              onChange={(e) => setField('starter_code', e.target.value)}
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
        type="button"
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

