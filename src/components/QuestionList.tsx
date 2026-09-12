import { useCallback } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Question } from '@/lib/types';
import { deleteQuestion } from '@/lib/api';
import { useToast } from './Toast';
import { PAGE_SIZE } from './AdminPanelConstants';

interface QuestionListProps {
  readonly questions: Question[];
  readonly loading: boolean;
  readonly page: number;
  readonly pageCount: number;
  readonly onPageChange: (updater: (p: number) => number) => void;
  readonly onQuestionsChanged: () => void;
  readonly onStartEdit: (q: Question) => void;
}

export function QuestionList({
  questions,
  loading,
  page,
  pageCount,
  onPageChange,
  onQuestionsChanged,
  onStartEdit,
}: QuestionListProps) {
  const { notify } = useToast();
  const visibleQuestions = questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <button type="button" aria-label="Previous page" title="Previous page" disabled={page === 1} onClick={() => onPageChange((p) => p - 1)} className="rounded-md border border-slate-300 bg-white p-1.5 hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" aria-label="Next page" title="Next page" disabled={page === pageCount} onClick={() => onPageChange((p) => p + 1)} className="rounded-md border border-slate-300 bg-white p-1.5 hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}
