import { useState, useEffect, useRef } from 'react';
import { Copy, Check, Code2, FileText, Briefcase, GraduationCap } from 'lucide-react';
import type { Question } from '@/lib/types';
import { Markdown } from './Markdown';

export function QuestionCard({ question }: Readonly<{ question: Question }>) {
  if (question.type === 'CODING') {
    return <CodingCard question={question} />;
  }
  return <ConceptualCard question={question} />;
}

function MetaRow({ question }: Readonly<{ question: Question }>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {question.roles.map((r) => (
        <span key={r} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          <Briefcase className="h-3 w-3" /> {r}
        </span>
      ))}
      {question.skills.map((s) => (
        <span key={s} className="flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
          <GraduationCap className="h-3 w-3" /> {s}
        </span>
      ))}
      <span className="ml-auto text-xs text-slate-400">Min exp: {question.minExperience}+ yrs</span>
    </div>
  );
}

function ConceptualCard({ question }: Readonly<{ question: Question }>) {
  return (
    <article className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-600">
        <FileText className="h-4 w-4" /> Conceptual
      </div>
      <div className="mb-2 text-sm font-medium text-slate-400">{question.topic} / {question.subtopic}</div>
      <h1 className="mb-4 text-2xl font-bold leading-tight text-slate-900">{question.question}</h1>
      <div className="mb-6"><MetaRow question={question} /></div>
      <div className="border-t border-slate-100 pt-6">
        <Markdown content={question.answer} />
      </div>
    </article>
  );
}

function CodingCard({ question }: Readonly<{ question: Question }>) {
  const [copied, setCopied] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = async () => {
    try {
      const textToCopy = question.answer ?? '';
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopied(true);
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // Log the error for observability and avoid breaking the UI by not rethrowing.
      console.error('Failed to copy answer to clipboard', err);
      setCopied(false);
    }
  };

  return (
    <article className="grid w-full gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
      <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
          <Code2 className="h-4 w-4" /> Coding Challenge
        </div>
        <div className="mb-2 text-sm font-medium text-slate-400">{question.topic} / {question.subtopic}</div>
        <h1 className="mb-4 text-xl font-bold leading-tight text-slate-900">{question.question}</h1>
        <div className="mb-5"><MetaRow question={question} /></div>
        <div className="border-t border-slate-100 pt-5">
          <Markdown content={question.answer} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Answer</span>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="min-h-[260px] overflow-auto bg-white p-4">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-800">
            {question.answer || 'No answer provided.'}
          </pre>
        </div>
      </div>
    </article>
  );
}
