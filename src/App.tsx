import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Settings2, Loader2, Library } from 'lucide-react';
import { ToastProvider, useToast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { QuestionCard } from './components/QuestionCard';
import { AdminPanel } from './components/AdminPanel';
import { AdminGuard } from './components/AdminGuard';
import { fetchAdminQuestions, fetchQuestions } from './lib/api';
import type { Filters, Question } from './lib/types';

type View = 'library' | 'admin';

const EMPTY_FILTERS: Filters = { search: '', role: '', skills: [], minExperience: 0 };
const PANEL_MIN_WIDTH = 288;
const PANEL_MAX_WIDTH = 560;
const QUESTIONS_PER_PAGE = 10;

function getStoredPanelWidth() {
  const storedWidth = Number(window.localStorage.getItem('skillsync.library.panelWidth') ?? window.localStorage.getItem('interview-manager.library.panelWidth'));
  return Number.isFinite(storedWidth)
    ? Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, storedWidth))
    : 320;
}

function AppInner() {
  const { notify } = useToast();
  const [view, setView] = useState<View>('library');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [adminQuestions, setAdminQuestions] = useState<Question[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Question | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[] | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [libraryPage, setLibraryPage] = useState(1);
  const [panelWidth, setPanelWidth] = useState(getStoredPanelWidth);
  const resizeStart = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    window.localStorage.setItem('skillsync.library.panelWidth', String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!resizeStart.current) return;
      const nextWidth = resizeStart.current.width + event.clientX - resizeStart.current.x;
      setPanelWidth(Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, nextWidth)));
    };
    const stopResizing = () => {
      resizeStart.current = null;
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

  const load = useCallback(async () => {
    try {
      const data = await fetchQuestions(filters);
      setQuestions(data);
    } catch (e) {
      notify('error', `Failed to load questions: ${(e as Error).message}`);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, notify]);

  const loadAdmin = useCallback(async () => {
    setAdminLoading(true);
    try {
      setAdminQuestions(await fetchAdminQuestions());
    } catch (e) {
      notify('error', `Failed to load admin questions: ${(e as Error).message}`);
      setAdminQuestions([]);
    } finally {
      setAdminLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setSelectedQuestions(null);
    setLibraryPage(1);
  }, [filters]);

  const selectQuestion = (q: Question) => {
    setSelected(q);
    setSelectedQuestions([q]);
    setEditing(null);
    setView('library');
    setLibraryPage(1);
  };

  const selectQuestionGroup = (group: Question[]) => {
    setSelected(group[0] ?? null);
    setSelectedQuestions(group);
    setEditing(null);
    setView('library');
    setLibraryPage(1);
  };

  const startEdit = (q: Question) => {
    setEditing(q);
    setView('admin');
  };

  const libraryQuestions = selectedQuestions ?? questions;
  const libraryPageCount = Math.max(1, Math.ceil(libraryQuestions.length / QUESTIONS_PER_PAGE));
  const visibleLibraryQuestions = useMemo(
    () => libraryQuestions.slice((libraryPage - 1) * QUESTIONS_PER_PAGE, libraryPage * QUESTIONS_PER_PAGE),
    [libraryPage, libraryQuestions],
  );
  const refreshQuestions = async () => Promise.all([load(), loadAdmin()]);

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-slate-900">SkillSync</h1>
            <p className="text-xs text-slate-400">Practice, revise, and manage interview questions</p>
          </div>
        </div>
        <nav className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setView('library')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === 'library' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Library className="h-4 w-4" /> Library
          </button>
          <button
            type="button"
            onClick={() => setView('admin')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === 'admin' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings2 className="h-4 w-4" /> Admin
          </button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {view === 'library' && (
          <>
            <div className="relative shrink-0 overflow-hidden" style={{ width: panelWidth }}>
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <Sidebar
                  questions={questions}
                  filters={filters}
                  onFiltersChange={setFilters}
                  selectedId={selected?.id ?? null}
                  onSelect={selectQuestion}
                  onSelectGroup={selectQuestionGroup}
                />
              )}
              <button
                type="button"
                aria-label="Resize Library panel"
                title="Drag to resize Library panel"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  resizeStart.current = { x: event.clientX, width: panelWidth };
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                }}
                onPointerCancel={() => {
                  resizeStart.current = null;
                  document.body.style.removeProperty('cursor');
                  document.body.style.removeProperty('user-select');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') { event.preventDefault(); setPanelWidth((width) => Math.max(PANEL_MIN_WIDTH, width - 16)); }
                  if (event.key === 'ArrowRight') { event.preventDefault(); setPanelWidth((width) => Math.min(PANEL_MAX_WIDTH, width + 16)); }
                  if (event.key === 'Home') { event.preventDefault(); setPanelWidth(PANEL_MIN_WIDTH); }
                  if (event.key === 'End') { event.preventDefault(); setPanelWidth(PANEL_MAX_WIDTH); }
                }}
                className="group absolute right-0 top-0 z-20 h-full w-3 cursor-col-resize touch-none border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
              >
                <span className="absolute left-1/2 top-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 transition group-hover:bg-sky-400 group-focus-visible:bg-sky-500" />
              </button>
            </div>
            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8">
              {libraryQuestions.length > 0 ? (
                <div className="flex min-w-0 w-full flex-col gap-6">
                  {visibleLibraryQuestions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
                  <Pagination page={libraryPage} pageCount={libraryPageCount} onPageChange={setLibraryPage} />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <BookOpen className="h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-lg font-semibold text-slate-600">Select a question to begin</p>
                  <p className="text-sm text-slate-400">Browse the library on the left, or use filters to narrow down.</p>
                </div>
              )}
            </main>
          </>
        )}
        {view === 'admin' && (
          <div className="flex-1 overflow-hidden">
            <AdminGuard
              onAuthenticated={loadAdmin}
              onLogout={() => { setAdminQuestions([]); setEditing(null); }}
            >
              <AdminPanel
                questions={adminQuestions}
                loading={adminLoading}
                editing={editing}
                onQuestionsChanged={refreshQuestions}
                onStartEdit={startEdit}
                onCancelEdit={() => setEditing(null)}
              />
            </AdminGuard>
          </div>
        )}
      </div>
    </div>
  );
}

function Pagination({ page, pageCount, onPageChange }: Readonly<{ page: number; pageCount: number; onPageChange: (page: number) => void }>) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 pb-2 text-sm text-slate-600">
      <button
        type="button"
        aria-label="Previous page"
        title="Previous page"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-slate-300 bg-white p-1.5 hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span>Page {page} of {pageCount}</span>
      <button
        type="button"
        aria-label="Next page"
        title="Next page"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-slate-300 bg-white p-1.5 hover:border-sky-400 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
