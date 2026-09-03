import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AdminPanel } from '@/components/AdminPanel';
import { ToastProvider } from '@/components/Toast';
import type { Question } from '@/lib/types';
import * as api from '@/lib/api';
import * as xlsx from '@/lib/xlsx';

vi.mock('@/lib/api', () => ({
  fetchAdminQuestions: vi.fn(),
  fetchAllQuestions: vi.fn(),
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
  batchInsertQuestions: vi.fn(),
}));

vi.mock('@/lib/xlsx', () => ({
  parseQuestionsXlsx: vi.fn(() => ({ rows: [], errors: [] })),
  downloadQuestionsTemplate: vi.fn(),
  downloadQuestionsXlsx: vi.fn(),
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

  it('shows error when uploading an empty xlsx file', async () => {
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
    const emptyXlsx = new File([], 'empty.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(fileInput, { target: { files: [emptyXlsx] } });

    await waitFor(() => {
      expect(screen.getByText(/The uploaded file is empty/i)).toBeInTheDocument();
    });
  });

  it('shows info toast when export has no questions', async () => {
    vi.mocked(api.fetchAllQuestions).mockResolvedValueOnce([]);

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

    fireEvent.click(screen.getByRole('button', { name: /Export XLSX/i }));

    await waitFor(() => {
      expect(screen.getByText(/No questions to export/i)).toBeInTheDocument();
    });
    expect(xlsx.downloadQuestionsXlsx).not.toHaveBeenCalled();
  });
});
