import ReactMarkdown from 'react-markdown';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = String(children ?? '');
  const lang = className?.replace('language-', '') || 'text';

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-900"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-editor overflow-x-auto px-4 py-3 text-base leading-relaxed text-slate-900">
        <code className="bg-transparent p-0 text-inherit">{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

function highlightCode(code: string) {
  const tokenPattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:public|private|protected|class|interface|extends|implements|static|final|void|return|new|if|else|for|while|try|catch|throw|throws|import|package|const|let|var|function|async|await|true|false|null)\b|\b[A-Z][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(code.slice(lastIndex, index));
    const tokenClass = token.startsWith('//') || token.startsWith('/*')
      ? 'text-green-700'
      : token.startsWith('"') || token.startsWith("'") || token.startsWith('`')
        ? 'text-green-700'
        : /^(true|false|null)$/.test(token)
          ? 'text-blue-700'
          : /^(public|private|protected|class|interface|extends|implements|static|final|void|return|new|if|else|for|while|try|catch|throw|throws|import|package|const|let|var|function|async|await)$/.test(token)
            ? 'font-semibold text-blue-700'
            : 'text-slate-900';
    parts.push(<span key={`${index}-${token}`} className={tokenClass}>{token}</span>);
    lastIndex = index + token.length;
  }

  if (lastIndex < code.length) parts.push(code.slice(lastIndex));
  return parts;
}

function normalizeInlineTable(content: string) {
  if (content.includes('\n')) return content;

  const cells = content.split('|').map((cell) => cell.trim()).filter(Boolean);
  const separatorStart = cells.findIndex((cell, index) =>
    index > 0 && /^:?-{3,}:?$/.test(cell) && /^:?-{3,}:?$/.test(cells[index + 1] ?? ''),
  );
  if (separatorStart < 1) return content;

  const columnCount = separatorStart;
  const separatorEnd = separatorStart + columnCount;
  if (cells.length < separatorEnd + columnCount || cells.length % columnCount !== 0) return content;

  const header = cells.slice(0, columnCount);
  const separator = cells.slice(separatorStart, separatorEnd);
  const body = cells.slice(separatorEnd);
  const rows = [header, separator];
  for (let index = 0; index < body.length; index += columnCount) {
    rows.push(body.slice(index, index + columnCount));
  }

  return rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
}

function normalizeMarkdown(content: string) {
  return normalizeInlineTable(content);
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown-content prose prose-base max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-code:rounded-none prose-code:bg-transparent prose-code:px-0 prose-code:py-0 prose-code:text-inherit prose-code:font-normal prose-code:not-italic prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-sky-400 prose-blockquote:bg-sky-50 prose-blockquote:py-1 prose-blockquote:text-slate-700 prose-table:overflow-hidden prose-table:border prose-th:bg-slate-50 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:uppercase prose-th:tracking-wide prose-th:text-slate-600 prose-td:px-3 prose-td:py-1.5 prose-td:text-sm prose-td:text-slate-700">
      <ReactMarkdown
        components={{
          pre({ children }) {
            const child = Array.isArray(children) ? children[0] : children;
            const props = (child as React.ReactElement)?.props as { className?: string; children?: React.ReactNode };
            return <CodeBlock className={props?.className}>{props?.children}</CodeBlock>;
          },
        }}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
