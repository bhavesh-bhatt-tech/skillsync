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
      starterCode: null,
      skills: ['Java 21'],
      roles: ['Backend'],
      minExperience: 3,
      createdAt: new Date().toISOString()
    },
  ];

  const manyQuestions: Question[] = Array.from({ length: 15 }, (_, i) => ({
    id: `${i + 1}`,
    topic: 'Java',
    subtopic: 'Topic',
    question: `Question ${i + 1}`,
    answer: 'Answer',
    type: 'CONCEPTUAL',
    starterCode: null,
    skills: ['Skill'],
    roles: ['Role'],
    minExperience: 1,
    createdAt: new Date().toISOString(),
  }));

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
  it('handles successful export of questions', async () => {
    vi.mocked(api.fetchAllQuestions).mockResolvedValueOnce([
      {
        id: '1',
        topic: 'Java',
        subtopic: 'Concurrency',
        question: 'What are virtual threads?',
        answer: 'Lightweight threads',
        type: 'CONCEPTUAL',
        starterCode: null,
        skills: ['Java 21'],
        roles: ['Backend'],
        minExperience: 3,
        createdAt: sampleQuestions[0].createdAt,
      },
    ]);

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
      expect(xlsx.downloadQuestionsXlsx).toHaveBeenCalledWith('questions.xlsx', sampleQuestions);
    });
  });

  it('handles export error gracefully', async () => {
    vi.mocked(api.fetchAllQuestions).mockRejectedValueOnce(new Error('Export error'));

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
      expect(screen.getByText(/Export failed: Export error/i)).toBeInTheDocument();
    });
  });

  it('handles drag and drop upload events', async () => {
    const onQuestionsChanged = vi.fn();
    vi.mocked(xlsx.parseQuestionsXlsx).mockReturnValueOnce({
      rows: [
        {
          topic: 'Java',
          subtopic: 'Core',
          question: 'Q1',
          answer: 'A1',
          type: 'CONCEPTUAL',
          starterCode: null,
          skills: ['Java'],
          roles: ['Backend'],
          minExperience: 2,
        },
      ],
      errors: [],
    });
    vi.mocked(api.batchInsertQuestions).mockResolvedValueOnce([
      {
        id: '1',
        topic: 'Java',
        subtopic: 'Core',
        question: 'Q1',
        answer: 'A1',
        type: 'CONCEPTUAL',
        starterCode: null,
        skills: ['Java'],
        roles: ['Backend'],
        minExperience: 2,
      },
    ]);

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

    const dropZone = screen.getByLabelText('File upload dropzone');
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);

    const validFile = new File(['content'], 'questions.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [validFile],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(api.batchInsertQuestions).toHaveBeenCalled();
      expect(onQuestionsChanged).toHaveBeenCalled();
    });
  });

  it('handles excel parse errors during file upload', async () => {
    vi.mocked(xlsx.parseQuestionsXlsx).mockReturnValueOnce({
      rows: [],
      errors: ['Invalid format at row 1'],
    });

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
    const validFile = new File(['content'], 'questions.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(await screen.findByText(/Spreadsheet errors/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('handles batch insert failure during file upload', async () => {
    vi.mocked(xlsx.parseQuestionsXlsx).mockReturnValueOnce({
      rows: [
        {
          topic: 'Java',
          subtopic: 'Core',
          question: 'Q1',
          answer: 'A1',
          type: 'CONCEPTUAL',
          starterCode: null,
          skills: ['Java'],
          roles: ['Backend'],
          minExperience: 2,
        },
      ],
      errors: [],
    });
    vi.mocked(api.batchInsertQuestions).mockRejectedValueOnce(new Error('Batch failed'));

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
    const validFile = new File(['content'], 'questions.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(await screen.findByText(/Import failed: Batch failed/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('supports pagination when questions exceed 10 items', () => {

    renderWithProviders(
      <AdminPanel
        questions={manyQuestions}
        loading={false}
        editing={null}
        onQuestionsChanged={() => {}}
        onStartEdit={() => {}}
        onCancelEdit={() => {}}
      />
    );

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Next page/i }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByText('Question 11')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Previous page/i }));
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('triggers onStartEdit when edit button is clicked', () => {
    const onStartEdit = vi.fn();

    renderWithProviders(
      <AdminPanel
        questions={sampleQuestions}
        loading={false}
        editing={null}
        onQuestionsChanged={() => {}}
        onStartEdit={onStartEdit}
        onCancelEdit={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Edit question/i }));
    expect(onStartEdit).toHaveBeenCalledWith(sampleQuestions[0]);
  });

});

