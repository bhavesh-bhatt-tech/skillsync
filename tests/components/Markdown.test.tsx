import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Markdown } from '@/components/Markdown';
import '@testing-library/jest-dom/vitest';

describe('Markdown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders markdown paragraphs and bold text', () => {
    render(<Markdown content="Hello **World**" />);
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('renders lists and text content', () => {
    render(<Markdown content="Item One\nItem Two" />);
    expect(screen.getByText(/Item One/i)).toBeInTheDocument();
    expect(screen.getByText(/Item Two/i)).toBeInTheDocument();
  });

  it('renders code block with syntax highlighting and copy button', () => {
    const codeContent = '```typescript\nconst x = 10;\n```';
    render(<Markdown content={codeContent} />);
    expect(screen.getByText('const')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('handles empty or blank content gracefully', () => {
    const { container } = render(<Markdown content="" />);
    expect(container).toBeInTheDocument();
  });

  it('renders inline code blocks correctly', () => {
    render(<Markdown content="Use `console.log()` for debugging" />);
    expect(screen.getByText('console.log()')).toBeInTheDocument();
  });

  it('handles malformed or unclosed code blocks', () => {
    render(<Markdown content="```javascript\nlet a = 1;" />);
    expect(screen.getByText(/copy/i)).toBeInTheDocument();
    expect(screen.getByText(/javascript/i)).toBeInTheDocument();
  });

  it('copies code from code block', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<Markdown content={'```js\nconst a = 1;\n```'} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith('const a = 1;\n');

    vi.advanceTimersByTime(1);
    expect(screen.getByText('Copied')).toBeInTheDocument();

    vi.advanceTimersByTime(1500);
    expect(screen.getByText('Copy')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('normalizes inline markdown table into rows', () => {
    const { container } = render(<Markdown content={'| col1 | col2 | --- | --- | a | b |'} />);
    expect(container.textContent).toContain('| col1 | col2 |');
    expect(container.textContent).toContain('| a | b |');
  });
});
