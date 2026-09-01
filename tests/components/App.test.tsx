import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import App from '@/App';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  fetchQuestions: vi.fn(),
  fetchAdminQuestions: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(api.fetchQuestions).mockResolvedValue([
      {
        id: '1',
        topic: 'System Design',
        subtopic: 'Caching',
        question: 'Explain Redis caching strategies',
        answer: 'Write-through vs Cache-aside',
        type: 'SYSTEM-DESIGN',
        starter_code: null,
        skills: ['Redis'],
        roles: ['Architect'],
        min_experience: 5,
        created_at: new Date().toISOString(),
      },
    ]);
  });

  it('renders application header and fetches questions', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('SkillSync')).toBeInTheDocument();
      expect(screen.getAllByText('Explain Redis caching strategies').length).toBeGreaterThan(0);
    });
  });

  it('switches to admin view after authenticating', async () => {
    // @ts-ignore
    import.meta.env.VITE_ADMIN_KEY = 'admin-secret';
    vi.mocked(api.fetchAdminQuestions).mockResolvedValue([
      {
        id: '2',
        topic: 'Node',
        subtopic: 'Express',
        question: 'What is middleware?',
        answer: 'A chain of handlers',
        type: 'CONCEPTUAL',
        starter_code: null,
        skills: ['Node'],
        roles: ['Backend'],
        min_experience: 2,
        created_at: new Date().toISOString(),
      },
    ]);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Admin/i }));
    fireEvent.change(screen.getByLabelText('Admin key'), { target: { value: 'admin-secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(api.fetchAdminQuestions).toHaveBeenCalled();
      expect(screen.getByText('Add Question')).toBeInTheDocument();
    });
  });

  it('shows the empty state when no questions are returned', async () => {
    vi.mocked(api.fetchQuestions).mockResolvedValue([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Select a question to begin')).toBeInTheDocument();
    });
  });

  it('renders pagination and moves to the next page', async () => {
    const manyQuestions = Array.from({ length: 11 }, (_, index) => ({
      id: String(index + 1),
      topic: 'System Design',
      subtopic: index % 2 === 0 ? 'Caching' : 'Scaling',
      question: `Question ${index + 1}`,
      answer: 'Example answer',
      type: 'SYSTEM-DESIGN',
      starter_code: null,
      skills: ['System Design'],
      roles: ['Architect'],
      min_experience: 5,
      created_at: new Date().toISOString(),
    }));

    vi.mocked(api.fetchQuestions).mockResolvedValue(manyQuestions);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Next page'));

    await waitFor(() => {
      const main = screen.getByRole('main');
      expect(within(main).getByText('Question 11')).toBeInTheDocument();
    });
  });
});
