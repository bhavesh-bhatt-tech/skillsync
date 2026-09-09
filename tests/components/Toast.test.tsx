import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/Toast';

function TestComponent() {
  const { notify } = useToast();
  return (
    <div>
      <button onClick={() => notify('success', 'Operation successful!')}>Trigger Success</button>
      <button onClick={() => notify('error', 'Something went wrong!')}>Trigger Error</button>
      <button onClick={() => notify('info', 'FYI message')}>Trigger Info</button>
    </div>
  );
}

describe('ToastProvider & useToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for expected React error boundary / invariant
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<TestComponent />)).toThrow('useToast must be used within ToastProvider');
    consoleSpy.mockRestore();
  });

  it('renders notifications when notify is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Info' }));
    expect(screen.getByText('FYI message')).toBeInTheDocument();
  });

  it('removes toasts after timeout', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Success' }));
    expect(screen.getByText('Operation successful!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Operation successful!')).not.toBeInTheDocument();
  });
});
