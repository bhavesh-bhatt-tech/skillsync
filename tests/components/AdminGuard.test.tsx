import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminGuard } from '@/components/AdminGuard';
import { ADMIN_KEY_STORAGE } from '@/lib/adminAuth';

describe('AdminGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.stubEnv('VITE_ADMIN_KEY', 'correct-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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

  it('logs out successfully when logout button is clicked and triggers onLogout callback', () => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, 'correct-key');
    const onLogout = vi.fn();

    render(
      <AdminGuard onLogout={onLogout}>
        <div>Protected Content</div>
      </AdminGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));
    expect(screen.getByText('Admin access')).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_KEY_STORAGE)).toBeNull();
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onAuthenticated when a valid session key already exists', () => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, 'correct-key');
    const onAuthenticated = vi.fn();

    render(
      <AdminGuard onAuthenticated={onAuthenticated}>
        <div>Protected Content</div>
      </AdminGuard>
    );

    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows a configuration error when no admin key is configured', () => {
    vi.stubEnv('VITE_ADMIN_KEY', '');

    render(
      <AdminGuard>
        <div>Protected Content</div>
      </AdminGuard>
    );

    const input = screen.getByLabelText('Admin key');
    fireEvent.change(input, { target: { value: 'any-key' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Admin access is not configured on this deployment.');
  });
});
