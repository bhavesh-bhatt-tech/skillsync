import { useMemo, useCallback, useState, useEffect } from 'react';
import type { Question } from '../lib/types';

export interface SidebarProps {
  questions: Question[];
  filters: {
    search: string;
    role: string;
    skills: string[];
    minExperience: number;
  };
  onFiltersChange: (filters: SidebarProps['filters']) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  onSelectGroup?: (topic: string, subtopic: string) => void;
}

export function Sidebar({
  questions,
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
}: Readonly<SidebarProps>) {
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

  // FIX 1: Proper memoization with all dependencies
  const allRoles = useMemo(
    () => Array.from(new Set(questions.flatMap((q) => q.roles))).sort((a, b) => a.localeCompare(b)),
    [questions],
  );

  const allSkills = useMemo(
    () => Array.from(new Set(questions.flatMap((q) => q.skills))).sort((a, b) => a.localeCompare(b)),
    [questions],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Question[]>>();
    for (const q of questions) {
      if (!q.topic || !q.subtopic) continue;
      if (!map.has(q.topic)) map.set(q.topic, new Map());
      const sub = map.get(q.topic)!;
      if (!sub.has(q.subtopic)) sub.set(q.subtopic, []);
      sub.get(q.subtopic)!.push(q);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questions]);

  // FIX 2: Use useCallback for stable event handlers
  const toggleSkill = useCallback(
    (skill: string) => {
      const next = filters.skills.includes(skill)
        ? filters.skills.filter((s) => s !== skill)
        : [...filters.skills, skill];
      onFiltersChange({ ...filters, skills: next });
    },
    [filters, onFiltersChange],
  );

  const clearAll = useCallback(() => {
    onFiltersChange({ search: '', role: '', skills: [], minExperience: 0 });
  }, [onFiltersChange]);

  const hasFilters = filters.role || filters.skills.length > 0 || filters.minExperience > 0 || Boolean(filters.search);

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <div className="sticky top-0 border-b border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-slate-900">Questions</h1>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <>
            <input
              type="search"
              placeholder="Search titles & answers..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />

            <select
              value={filters.role}
              onChange={(e) => onFiltersChange({ ...filters, role: e.target.value })}
              className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              {allRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Skills</span>
                <button
                  type="button"
                  onClick={() => setShowSkills((value) => !value)}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  {showSkills ? 'Hide' : 'Show'} All
                </button>
              </div>

              {showSkills && (
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        filters.skills.includes(skill)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              type="number"
              min="0"
              placeholder="Min Experience (years)"
              value={filters.minExperience || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, minExperience: Math.max(0, Number(e.target.value) || 0) })
              }
              className="mt-3 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-3 w-full rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
              >
                Clear All
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {grouped.map(([topic, subtopics]) => (
          <div key={topic} className="border-b border-slate-200">
            <div className="px-4 py-2 font-semibold text-slate-900">{topic}</div>
            {Array.from(subtopics.entries()).map(([subtopic, topicQuestions]) => (
              <div key={`${topic}-${subtopic}`} className="px-4 py-1">
                <div className="mb-1 font-medium text-slate-700">{subtopic}</div>
                {topicQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelect(q.id)}
                    className={`mb-1 block w-full truncate rounded px-2 py-1 text-left text-sm transition-colors ${
                      selectedId === q.id
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}