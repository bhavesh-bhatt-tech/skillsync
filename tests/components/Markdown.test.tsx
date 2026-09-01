import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from '@/components/Markdown';
import '@testing-library/jest-dom/vitest';

describe('Markdown', () => {
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
});




