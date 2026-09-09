import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '@/App';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  fetchQuestions: vi.fn(),
  fetchAdminQuestions: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(api.fetchQuestions).mockResolvedValue([
      {
        id: '1',
        topic: 'System Design',
        subtopic: 'Caching',
        question: 'Explain Redis caching strategies',
        answer: 'Write-through vs Cache-aside',
        type: 'SYSTEM_DESIGN',
        starterCode: null,
        skills: ['Redis'],
        roles: ['Architect'],
        minExperience: 5,
        createdAt: new Date().toISOString(),
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

  it('shows error toast when initial question load fails', async () => {
    vi.mocked(api.fetchQuestions).mockRejectedValueOnce(new Error('network down'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load questions: network down')).toBeInTheDocument();
      expect(screen.getByText('Select a question to begin')).toBeInTheDocument();
    });
  });

  it('applies persisted panel width constraints from localStorage', async () => {
    window.localStorage.setItem('skillsync.library.panelWidth', '9999');
    render(<App />);

    await waitFor(() => {
      const resizeButton = screen.getByRole('button', { name: 'Resize Library panel' });
      const panel = resizeButton.parentElement;
      expect(panel).toHaveStyle({ width: '560px' });
    });
  });

  it('updates panel width with keyboard resize shortcuts', async () => {
    render(<App />);

    const resizeButton = await screen.findByRole('button', { name: 'Resize Library panel' });
    fireEvent.keyDown(resizeButton, { key: 'ArrowRight' });
    fireEvent.keyDown(resizeButton, { key: 'Home' });
    fireEvent.keyDown(resizeButton, { key: 'End' });

    await waitFor(() => {
      expect(window.localStorage.getItem('skillsync.library.panelWidth')).toBe('560');
    });
  });

  it('switches to admin view after authenticating', async () => {
    // @ts-expect-error type override
    import.meta.env.VITE_ADMIN_KEY = 'admin-secret';
    vi.mocked(api.fetchAdminQuestions).mockResolvedValue([
      {
        id: '2',
        topic: 'Node',
        subtopic: 'Express',
        question: 'What is middleware?',
        answer: 'A chain of handlers',
        type: 'CONCEPTUAL',
        starterCode: null,
        skills: ['Node'],
        roles: ['Backend'],
        minExperience: 2,
        createdAt: new Date().toISOString(),
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
      type: 'SYSTEM_DESIGN' as const,
      starterCode: null,
      skills: ['System Design'],
      roles: ['Architect'],
      minExperience: 5,
      createdAt: new Date().toISOString(),
    }));

    vi.mocked(api.fetchQuestions).mockResolvedValue(manyQuestions);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Next page'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Question 11' })).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });
  });
});
