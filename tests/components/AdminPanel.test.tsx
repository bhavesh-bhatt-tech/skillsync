import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AdminPanel } from '@/components/AdminPanel';
import { ToastProvider } from '@/components/Toast';
import type { Question } from '@/lib/types';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  fetchAdminQuestions: vi.fn(),
  fetchAllQuestions: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  batchInsertQuestions: vi.fn(),
}));

function renderWithProviders(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('AdminPanel', () => {
  const sampleQuestions: Question[] = [
    {
      id: '1',
      topic: 'Java',
      subtopic: 'Concurrency',
      question: 'What are virtual threads?',
      answer: 'Lightweight threads',
      type: 'CONCEPTUAL',
      starter_code: null,
      skills: ['Java 21'],
      roles: ['Backend'],
      min_experience: 3,
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders question table and headers', () => {
    renderWithProviders(
      <AdminPanel
        questions={sampleQuestions}
        loading={false}
        editing={null}
        onQuestionsChanged={() => {}}
        onStartEdit={() => {}}
        onCancelEdit={() => {}}
      />
    );

    expect(screen.getByText('What are virtual threads?')).toBeInTheDocument();
    expect(screen.getByText(/Manage Questions · Total: 1/i)).toBeInTheDocument();
  });

  it('handles question deletion with confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(api.deleteQuestion).mockResolvedValueOnce();
    const onQuestionsChanged = vi.fn();

    renderWithProviders(
      <AdminPanel
        questions={sampleQuestions}
        loading={false}
        editing={null}
        onQuestionsChanged={onQuestionsChanged}
        onStartEdit={() => {}}
        onCancelEdit={() => {}}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete question/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.deleteQuestion).toHaveBeenCalledWith('1');
      expect(onQuestionsChanged).toHaveBeenCalled();
    });
  });

  it('aborts question deletion when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onQuestionsChanged = vi.fn();

    renderWithProviders(
      <AdminPanel
        questions={sampleQuestions}
        loading={false}
        editing={null}
        onQuestionsChanged={onQuestionsChanged}
        onStartEdit={() => {}}
        onCancelEdit={() => {}}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete question/i });
    fireEvent.click(deleteBtn);

    expect(api.deleteQuestion).not.toHaveBeenCalled();
    expect(onQuestionsChanged).not.toHaveBeenCalled();
  });

  it('shows error when uploading non-xlsx file', async () => {
    renderWithProviders(
      <AdminPanel
        questions={sampleQuestions}
        loading={false}
        editing={null}
        onQuestionsChanged={() => {}}
        onStartEdit={() => {}}
        onCancelEdit={() => {}}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Please upload an .xlsx file/i)).toBeInTheDocument();
    });
  });
});
