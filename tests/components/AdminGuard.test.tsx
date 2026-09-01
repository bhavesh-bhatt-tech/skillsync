import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminGuard } from '@/components/AdminGuard';
import { ADMIN_KEY_STORAGE } from '@/lib/adminAuth';

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    // @ts-ignore
    import.meta.env.VITE_ADMIN_KEY = 'correct-key';
  });

  it('renders login form when not authenticated', () => {
    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>
    );

    expect(screen.getByText('Admin access')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows error on invalid admin key', () => {
    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>
    );

    const input = screen.getByLabelText('Admin key');
    fireEvent.change(input, { target: { value: 'wrong-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent('That admin key is not valid.');
  });

  it('authenticates successfully with correct admin key', () => {
    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>
    );

    const input = screen.getByLabelText('Admin key');
    fireEvent.change(input, { target: { value: 'correct-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBe('correct-key');
  });

  it('logs out successfully when logout button is clicked', () => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, 'correct-key');

    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    expect(screen.getByText('Admin access')).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
  });
});
