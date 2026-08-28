import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Search, X, SlidersHorizontal } from 'lucide-react';
import type { Filters, Question } from '@/lib/types';

const SECTION_MIN_HEIGHT = 96;
const SECTION_MAX_HEIGHT = 640;

function getStoredHeight(storageKey: string, defaultHeight: number) {
  const storedHeight = Number(window.localStorage.getItem(storageKey));
  if (!Number.isFinite(storedHeight)) return defaultHeight;
  return Math.min(SECTION_MAX_HEIGHT, Math.max(SECTION_MIN_HEIGHT, storedHeight));
}

function ResizableSection({
  storageKey,
  defaultHeight,
  heightOverride,
  children,
  className = '',
}: {
  storageKey: string;
  defaultHeight: number;
  heightOverride?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [height, setHeight] = useState(() => getStoredHeight(storageKey, defaultHeight));
  const startRef = useRef<{ y: number; height: number } | null>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey, String(height));
  }, [height, storageKey]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!startRef.current) return;
      const nextHeight = startRef.current.height + event.clientY - startRef.current.y;
      setHeight(Math.min(SECTION_MAX_HEIGHT, Math.max(SECTION_MIN_HEIGHT, nextHeight)));
    };
    const stopResizing = () => {
      startRef.current = null;
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
    };
  }, []);

  const adjustHeight = (amount: number) => {
    setHeight((current) => Math.min(SECTION_MAX_HEIGHT, Math.max(SECTION_MIN_HEIGHT, current + amount)));
  };

  return (
    <section className={`relative flex min-h-0 shrink-0 flex-col overflow-hidden ${className}`} style={{ height: heightOverride ?? height }}>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <button
        type="button"
        aria-label="Resize section"
        title="Drag to resize section"
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          startRef.current = { y: event.clientY, height };
          document.body.style.cursor = 'row-resize';
          document.body.style.userSelect = 'none';
        }}
        onPointerCancel={() => {
          startRef.current = null;
          document.body.style.removeProperty('cursor');
          document.body.style.removeProperty('user-select');
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') { event.preventDefault(); adjustHeight(-16); }
          if (event.key === 'ArrowDown') { event.preventDefault(); adjustHeight(16); }
          if (event.key === 'Home') { event.preventDefault(); setHeight(SECTION_MIN_HEIGHT); }
          if (event.key === 'End') { event.preventDefault(); setHeight(SECTION_MAX_HEIGHT); }
        }}
        className="group absolute bottom-0 left-0 z-10 h-3 w-full cursor-row-resize touch-none border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
      >
        <span className="absolute left-1/2 top-1/2 h-1 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 transition group-hover:bg-sky-400 group-focus-visible:bg-sky-500" />
      </button>
    </section>
  );
}

interface SidebarProps {
  questions: Question[];
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  selectedId: string | null;
  onSelect: (q: Question) => void;
  onSelectGroup: (questions: Question[]) => void;
}

export function Sidebar({ questions, filters, onFiltersChange, selectedId, onSelect, onSelectGroup }: SidebarProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [showSkills, setShowSkills] = useState(() => {
    const storedValue = window.localStorage.getItem('skillsync.library.showSkills');
    return storedValue === null
      ? window.localStorage.getItem('interview-manager.library.showSkills') !== 'false'
      : storedValue !== 'false';
  });

  useEffect(() => {
    window.localStorage.setItem('skillsync.library.showSkills', String(showSkills));
  }, [showSkills]);

  const allRoles = useMemo(
    () => Array.from(new Set(questions.flatMap((q) => q.roles))).sort(),
    [questions],
  );
  const allSkills = useMemo(
    () => Array.from(new Set(questions.flatMap((q) => q.skills))).sort(),
    [questions],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Question[]>>();
    for (const q of questions) {
      if (!map.has(q.topic)) map.set(q.topic, new Map());
      const sub = map.get(q.topic)!;
      if (!sub.has(q.subtopic)) sub.set(q.subtopic, []);
      sub.get(q.subtopic)!.push(q);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  const toggleSkill = (skill: string) => {
    const next = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    onFiltersChange({ ...filters, skills: next });
  };

  const clearAll = () =>
    onFiltersChange({ search: '', role: '', skills: [], minExperience: 0 });

  const hasFilters = filters.role || filters.skills.length || filters.minExperience > 0 || filters.search;

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <ResizableSection storageKey="skillsync.library.search" defaultHeight={118} className="border-b border-slate-200">
        <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Library</h2>
          {hasFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Search titles & answers..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        </div>
      </ResizableSection>

      <ResizableSection
        storageKey="skillsync.library.filters"
        defaultHeight={290}
        heightOverride={showSkills ? undefined : 190}
        className="border-b border-slate-200 px-4 py-3"
      >
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            Filters
          </span>
          {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {showFilters && (
          <div className="mt-3 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Role</label>
              <select
                value={filters.role}
                onChange={(e) => onFiltersChange({ ...filters, role: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="">All roles</option>
                {allRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <input
                  type="checkbox"
                  checked={showSkills}
                  onChange={(event) => setShowSkills(event.target.checked)}
                  className="h-3.5 w-3.5 accent-sky-600"
                />
                Show Skills
              </label>
              {showSkills && (
                <div className="mt-2 grid auto-cols-[calc((100%-1.5rem)/5)] grid-flow-col auto-rows-max gap-1.5 overflow-x-auto pb-2">
                  {allSkills.slice(0, 10).map((s) => {
                    const active = filters.skills.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSkill(s)}
                        className={`w-full truncate rounded-full border px-2 py-1 text-xs font-medium transition ${
                          active
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-600'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Min Experience</label>
                <span className="text-xs font-semibold text-slate-700">
                  {filters.minExperience === 0 ? 'Any' : `${filters.minExperience}+ yrs`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                value={filters.minExperience}
                onChange={(e) => onFiltersChange({ ...filters, minExperience: Number(e.target.value) })}
                className="w-full accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0</span><span>15+</span>
              </div>
            </div>
          </div>
        )}
      </ResizableSection>

      <ResizableSection storageKey="skillsync.library.questions" defaultHeight={360} className="px-2 py-2">
        {grouped.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-slate-400">No questions match your filters.</p>
        )}
        {grouped.map(([topic, subs]) => (
          <TopicGroup
            key={topic}
            topic={topic}
            subs={Array.from(subs.entries())}
            selectedId={selectedId}
            onSelect={onSelect}
            onSelectGroup={onSelectGroup}
          />
        ))}
      </ResizableSection>
    </aside>
  );
}

function TopicGroup({
  topic,
  subs,
  selectedId,
  onSelect,
  onSelectGroup,
}: {
  topic: string;
  subs: [string, Question[]][];
  selectedId: string | null;
  onSelect: (q: Question) => void;
  onSelectGroup: (questions: Question[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const count = subs.reduce((n, [, qs]) => n + qs.length, 0);

  return (
    <div className="mb-1">
      <button
        onClick={() => {
          setOpen((v) => !v);
          onSelectGroup(subs.flatMap(([, questions]) => questions));
        }}
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
      >
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          {topic}
        </span>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{count}</span>
      </button>
      {open && (
        <div className="ml-3 border-l border-slate-200 pl-2">
          {subs.map(([subtopic, qs]) => (
            <SubtopicGroup
              key={subtopic}
              subtopic={subtopic}
              questions={qs}
              selectedId={selectedId}
              onSelect={onSelect}
              onSelectGroup={onSelectGroup}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubtopicGroup({
  subtopic,
  questions,
  selectedId,
  onSelect,
  onSelectGroup,
}: {
  subtopic: string;
  questions: Question[];
  selectedId: string | null;
  onSelect: (q: Question) => void;
  onSelectGroup: (questions: Question[]) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-1">
      <button
        onClick={() => {
          setOpen((v) => !v);
          onSelectGroup(questions);
        }}
        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs font-medium uppercase tracking-wide text-slate-500 hover:bg-slate-100"
      >
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {subtopic}
        </span>
        <span className="text-xs font-normal text-slate-400">{questions.length}</span>
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => onSelect(q)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition ${
                selectedId === q.id
                  ? 'bg-sky-50 text-sky-900 ring-1 ring-sky-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="min-w-0 flex-1 truncate" title={q.question}>{q.question}</span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  q.type === 'CODING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-sky-100 text-sky-700'
                }`}
              >
                {q.type === 'CODING' ? 'CODE' : 'Q'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
