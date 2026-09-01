import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '@/components/Toast';

function TestComponent() {
  const { notify } = useToast();
  return (
    <div>
      <button onClick={() => notify('success', 'Operation successful!')}>Trigger Success</button>
      <button onClick={() => notify('error', 'Something went wrong!')}>Trigger Error</button>
    </div>
  );
}

describe('ToastProvider & useToast', () => {
  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for expected React error boundary / invariant
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useToast must be used within ToastProvider');
    consoleSpy.mockRestore();
  });

  it('renders notifications when notify is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Success' }));
    expect(screen.getByText('Operation successful!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
  });
});
