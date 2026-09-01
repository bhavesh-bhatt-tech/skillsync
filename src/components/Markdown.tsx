import ReactMarkdown from 'react-markdown';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

type CodeBlockProps = Readonly<{ className?: string; children?: React.ReactNode }>;
type MarkdownProps = Readonly<{ content: string }>;

function CodeBlock({ className, children }: CodeBlockProps) {
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

const KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
  'let', 'new', 'package', 'return', 'static', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'true', 'false', 'null', 'public', 'private', 'protected',
  'interface', 'implements', 'final',
]);

function getTokenClass(token: string) {
  if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
    return 'text-green-700';
  }

  if (token === 'true' || token === 'false' || token === 'null') {
    return 'text-blue-700';
  }

  if (KEYWORDS.has(token)) {
    return 'font-semibold text-blue-700';
  }

  return 'text-slate-900';
}

function readSingleLineComment(code: string, start: number) {
  const end = code.indexOf('\n', start + 2);
  return end === -1 ? code.slice(start) : code.slice(start, end);
}

function readBlockComment(code: string, start: number) {
  const end = code.indexOf('*/', start + 2);
  return end === -1 ? code.slice(start) : code.slice(start, end + 2);
}

function readQuotedToken(code: string, start: number) {
  const quote = code[start];
  let end = start + 1;

  while (end < code.length) {
    if (code[end] === '\\') {
      end += 2;
      continue;
    }
    if (code[end] === quote) {
      return code.slice(start, end + 1);
    }
    end += 1;
  }

  return code.slice(start);
}

function readNumberToken(code: string, start: number) {
  let end = start + 1;
  while (end < code.length && /[\d.]/.test(code[end])) {
    end += 1;
  }
  return code.slice(start, end);
}

function readIdentifierToken(code: string, start: number) {
  let end = start + 1;
  while (end < code.length && /[A-Za-z0-9_$]/.test(code[end])) {
    end += 1;
  }
  return code.slice(start, end);
}

function getNextCodeToken(code: string, index: number) {
  const current = code[index];

  if (current === '/' && code[index + 1] === '/') {
    return readSingleLineComment(code, index);
  }

  if (current === '/' && code[index + 1] === '*') {
    return readBlockComment(code, index);
  }

  if (current === '"' || current === "'" || current === '`') {
    return readQuotedToken(code, index);
  }

  if (/\d/.test(current)) {
    return readNumberToken(code, index);
  }

  if (/[A-Za-z_$]/.test(current)) {
    return readIdentifierToken(code, index);
  }

  return current;
}

function highlightCode(code: string) {
  const parts: React.ReactNode[] = [];
  let index = 0;

  while (index < code.length) {
    const token = getNextCodeToken(code, index);
    parts.push(
      <span key={`${index}-${token}`} className={getTokenClass(token)}>{token}</span>,
    );
    index += token.length;
  }

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

function ensureClosedCodeBlocks(content: string) {
  const lines = content.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const match = /^([`~]{3,})/.exec(trimmed);

    if (!match) continue;

    const marker = match[1][0];
    const markerLength = match[1].length;

    if (!inFence) {
      inFence = true;
      fenceChar = marker;
      fenceLength = markerLength;
      continue;
    }

    if (marker === fenceChar && markerLength >= fenceLength) {
      inFence = false;
      fenceChar = '';
      fenceLength = 0;
    }
  }

  if (inFence && fenceChar) {
    lines.push(fenceChar.repeat(Math.max(fenceLength, 3)));
  }

  return lines.join('\n');
}

function normalizeMarkdown(content: string) {
  return normalizeInlineTable(ensureClosedCodeBlocks(content));
}

function MarkdownCodeRenderer({ children }: Readonly<{ children?: React.ReactNode }>) {
  const child = Array.isArray(children) ? children[0] : children;
  const props = (child as React.ReactElement | undefined)?.props as { className?: string; children?: React.ReactNode } | undefined;
  return <CodeBlock className={props?.className}>{props?.children}</CodeBlock>;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="markdown-content prose prose-base max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 prose-code:rounded-none prose-code:bg-transparent prose-code:px-0 prose-code:py-0 prose-code:text-inherit prose-code:font-normal prose-code:not-italic prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-l-sky-400 prose-blockquote:bg-sky-50 prose-blockquote:py-1 prose-blockquote:text-slate-700 prose-table:overflow-hidden prose-table:border prose-th:bg-slate-50 prose-th:px-3 prose-th:py-1.5 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:uppercase prose-th:tracking-wide prose-th:text-slate-600 prose-td:px-3 prose-td:py-1.5 prose-td:text-sm prose-td:text-slate-700">
      <ReactMarkdown components={{ pre: MarkdownCodeRenderer }}>
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
