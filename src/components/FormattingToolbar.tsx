import type { RefObject } from 'react';
import { Bold, Italic, Heading2, Code2 } from 'lucide-react';

interface FormattingToolbarProps {
  readonly inputRef: RefObject<HTMLTextAreaElement>;
  readonly onChange: (value: string) => void;
}

export function FormattingToolbar({ inputRef, onChange }: FormattingToolbarProps) {
  const applyFormat = (prefix: string, suffix: string, placeholder: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end) || placeholder;
    const nextValue = `${input.value.slice(0, start)}${prefix}${selected}${suffix}${input.value.slice(end)}`;
    onChange(nextValue);
    requestAnimationFrame(() => {
      input.focus();
      const selectionStart = start + prefix.length;
      input.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  };

  const buttonClass = 'rounded border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700';

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <button type="button" title="Bold" aria-label="Bold text formatting" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('**', '**', 'bold text')}>
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" title="Italic" aria-label="Italic text formatting" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('*', '*', 'italic text')}>
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" title="Heading size" aria-label="Heading formatting" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('## ', '', 'Heading')}>
        <Heading2 className="h-4 w-4" />
      </button>
      <button type="button" title="Code" aria-label="Inline code formatting" className={buttonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('`', '`', 'code')}>
        <Code2 className="h-4 w-4" />
      </button>
      <button type="button" title="Code block" aria-label="Code block formatting" className={`${buttonClass} text-xs`} onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('```\n', '\n```', 'code block')}>
        {'{ }'}
      </button>
    </div>
  );
}
