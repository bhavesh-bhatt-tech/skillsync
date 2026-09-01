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
    // The code block content is split into separate spans due to syntax highlighting.
    // Use a custom matcher to find the text content even if it's split.
    const element = screen.getByText((content, element) => {
      return element?.textContent?.includes('let a = 1;') ?? false;
    });
    expect(element).toBeInTheDocument();
  });
});
