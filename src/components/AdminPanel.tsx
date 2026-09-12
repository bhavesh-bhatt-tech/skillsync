import { useEffect, useState } from 'react';
import type { Question } from '@/lib/types';
import { QuestionForm } from './QuestionForm';
import { SpreadsheetPortal } from './SpreadsheetPortal';
import { QuestionList } from './QuestionList';
import { PAGE_SIZE } from './AdminPanelConstants';

interface AdminPanelProps {
  readonly questions: Question[];
  readonly loading: boolean;
  readonly editing: Question | null;
  readonly onQuestionsChanged: () => void;
  readonly onStartEdit: (q: Question) => void;
  readonly onCancelEdit: () => void;
}

export function AdminPanel(props: Readonly<AdminPanelProps>) {
  const { questions, loading, editing, onQuestionsChanged, onStartEdit, onCancelEdit } = props;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <QuestionForm
          key={editing?.id ?? 'new'}
          editing={editing}
          onSaved={() => { onQuestionsChanged(); onCancelEdit(); }}
          onCancel={onCancelEdit}
        />
        <SpreadsheetPortal onQuestionsChanged={onQuestionsChanged} />
        <QuestionList
          questions={questions}
          loading={loading}
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          onQuestionsChanged={onQuestionsChanged}
          onStartEdit={onStartEdit}
        />
      </div>
    </div>
  );
}
