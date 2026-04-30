import { useEffect, useMemo, useRef, useState } from 'react';
import { Filters } from './components/Filters';
import { ResultsTable } from './components/ResultsTable';
import { OverviewTab } from './tabs/OverviewTab';
import { DebtRepaymentTab } from './tabs/DebtRepaymentTab';
import { TrendsTab } from './tabs/TrendsTab';
import { MajorsTab } from './tabs/MajorsTab';
import { MapTab } from './tabs/MapTab';
import { DemographicsTab } from './tabs/DemographicsTab';
import { OutcomesTab } from './tabs/OutcomesTab';
import { SelectivityTab } from './tabs/SelectivityTab';
import { EarningsDistributionTab } from './tabs/EarningsDistributionTab';
import { RetentionTab } from './tabs/RetentionTab';
import { LoanAidTab } from './tabs/LoanAidTab';
import { FacultyTab } from './tabs/FacultyTab';
import { SchoolDetail } from './tabs/SchoolDetail';
import { CompareTab } from './tabs/CompareTab';
import { fetchSchoolById, searchAllSchools } from './api/scorecard';
import type { School, SearchFilters } from './api/scorecard';
import { decodeStateFromUrl, encodeStateToSearch } from './util/urlState';
import { buildSchoolPath, parseSchoolPath } from './util/schoolUrl';
import { downloadSchoolsCsv, getColumnCount } from './util/csv';
import { SuppressionNote } from './components/SuppressionNote';
import { useSession, signOut } from './lib/auth-client';
import { AUTH_ENABLED } from './util/featureFlags';
import { fetchPins, addPin, removePin } from './lib/pinsApi';
import { StudentsPage } from './components/StudentsPage';
import { StudentDetailPage } from './components/StudentDetailPage';
import { StarterPresets } from './components/StarterPresets';

type StudentView =
  | { kind: 'none' }
  | { kind: 'roster' }
  | { kind: 'student'; id: string };

function pathToStudentView(path: string): StudentView {
  // /app/students/<id>  → student detail
  // /app/students        → roster
  const m = path.match(/^\/app\/students\/([^/]+)$/);
  if (m) return { kind: 'student', id: m[1] };
  if (path === '/app/students' || path === '/app/students/') return { kind: 'roster' };
  return { kind: 'none' };
}

type TabId =
  | 'overview'
  | 'compare'
  | 'map'
  | 'debt'
  | 'trends'
  | 'majors'
  | 'demographics'
  | 'outcomes'
  | 'selectivity'
  | 'earnings'
  | 'retention'
  | 'loanaid'
  | 'faculty';

const TABS: { id: TabId; label: string; description: string }[] = [
  {
    id: 'overview',
    label: 'Overview',
    description:
      'Headline numbers — cost, earnings, completion, admissions — for every school in your filter.',
  },
  {
    id: 'compare',
    label: '📌 Compare',
    description:
      'Side-by-side comparison of pinned schools across cost, admissions, outcomes, debt, and demographics. Print-friendly.',
  },
  {
    id: 'map',
    label: 'Map',
    description: 'Where each school is, color-coded by the metric you choose.',
  },
  {
    id: 'selectivity',
    label: 'Admissions',
    description:
      'How easy or hard it is to get in. SAT and ACT score ranges, admit rates, and test-policy details.',
  },
  {
    id: 'earnings',
    label: 'Earnings',
    description:
      "Not just averages — how much grads actually earn 6 and 10 years after starting college, including the 10th to 90th percentile spread.",
  },
  {
    id: 'debt',
    label: 'Debt & Repayment',
    description:
      'Loan balances at graduation, default rates, and how quickly grads pay their loans down over time.',
  },
  {
    id: 'loanaid',
    label: 'Loans & Aid',
    description:
      'Who borrows what — including Parent PLUS loans — and what students from each family-income bracket actually pay.',
  },
  {
    id: 'retention',
    label: 'Retention',
    description:
      'Who stays through year two, who finishes within 6 years, and who transfers or withdraws along the way.',
  },
  {
    id: 'trends',
    label: 'Trends',
    description:
      'How metrics have shifted year by year. Pin schools to compare individual histories.',
  },
  {
    id: 'majors',
    label: 'Majors',
    description:
      'Per-program data: earnings and completers by major. Pin schools first to compare a specific program across institutions.',
  },
  {
    id: 'demographics',
    label: 'Who attends',
    description:
      'Student body composition: race, gender, age, family income, and first-generation share.',
  },
  {
    id: 'faculty',
    label: 'Faculty',
    description:
      'Faculty composition by race and gender, alongside the student body for direct comparison.',
  },
  {
    id: 'outcomes',
    label: 'By student type',
    description:
      'Completion and earnings broken out by race, gender, Pell-grant status, and family-income tercile.',
  },
];

// Nationwide default: all states, public + private nonprofit, ≥ 2000 students,
// bachelor's or graduate-predominant. Loads ~800 schools — meaningful but quick.
const DEFAULT_FILTERS: SearchFilters = {
  ownership: [1, 2],
  minSize: 2000,
  degreeLevels: [3, 4],
};

const TAB_IDS = new Set<TabId>([
  'overview',
  'map',
  'debt',
  'trends',
  'majors',
  'demographics',
  'outcomes',
  'selectivity',
  'earnings',
  'retention',
  'loanaid',
  'faculty',
]);

function readInitialState(): {
  filters: SearchFilters;
  selectedIds: Set<number>;
  activeTab: TabId;
  detailSchoolId: number | null;
} {
  if (typeof window === 'undefined') {
    return {
      filters: DEFAULT_FILTERS,
      selectedIds: new Set(),
      activeTab: 'overview',
      detailSchoolId: null,
    };
  }
  const decoded = decodeStateFromUrl(window.location.search);
  const hasAnyFilter = Object.keys(decoded.filters).length > 0;
  const tab =
    decoded.tab && TAB_IDS.has(decoded.tab as TabId)
      ? (decoded.tab as TabId)
      : 'overview';
  // Preference: /school/<id> in path > legacy ?detail= query param
  const fromPath = parseSchoolPath(window.location.pathname);
  const detailSchoolId = fromPath ?? decoded.detailSchoolId ?? null;
  return {
    filters: hasAnyFilter ? decoded.filters : DEFAULT_FILTERS,
    selectedIds: new Set(decoded.selectedIds),
    activeTab: tab,
    detailSchoolId,
  };
}

export default function App() {
  const initial = readInitialState();
  const { data: session } = useSession();
  // When auth is flag-disabled we treat everyone as logged-out so all the
  // student-roster / sign-in / sign-out chrome stays hidden.
  const userId = AUTH_ENABLED ? (session?.user?.id ?? null) : null;
  const isLoggedIn = !!userId;

  const [filters, setFilters] = useState<SearchFilters>(initial.filters);
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(initial.selectedIds);
  const [activeTab, setActiveTab] = useState<TabId>(initial.activeTab);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [detailSchoolId, setDetailSchoolId] = useState<number | null>(
    initial.detailSchoolId,
  );
  const [fetchedDetailSchool, setFetchedDetailSchool] = useState<School | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [studentView, setStudentView] = useState<StudentView>(() =>
    pathToStudentView(window.location.pathname),
  );

  // Listen for browser back/forward — keeps detail and student views in sync
  useEffect(() => {
    const onPop = () => {
      setStudentView(pathToStudentView(window.location.pathname));
      const fromPath = parseSchoolPath(window.location.pathname);
      const fromLegacy = decodeStateFromUrl(window.location.search).detailSchoolId;
      setDetailSchoolId(fromPath ?? fromLegacy ?? null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateStudents = (view: StudentView) => {
    let path = '/app';
    if (view.kind === 'roster') path = '/app/students';
    else if (view.kind === 'student') path = `/app/students/${view.id}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setStudentView(view);
  };

  // When the user logs in, hydrate selectedIds from server-persisted pins.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchPins()
      .then((pins) => {
        if (cancelled) return;
        setSelectedIds(new Set(pins.map((p) => p.schoolId)));
      })
      .catch(() => {
        // Silent: keep whatever was in URL state.
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Sync URL with state. Two regimes:
  //  • School detail open → /school/<slug>-<id> (SEO-friendly, shareable)
  //  • Dashboard          → /app?tab=...&state=... (state in query params)
  // We pushState on mode transitions so the browser back button works as users
  // expect; we replaceState for same-mode tweaks (filter change, tab change).
  const prevDetailRef = useRef<number | null>(initial.detailSchoolId);
  useEffect(() => {
    if (studentView.kind !== 'none') return;

    const onSchoolPath = parseSchoolPath(window.location.pathname) !== null;
    const transitioningToDetail = prevDetailRef.current === null && detailSchoolId !== null;
    const transitioningFromDetail = prevDetailRef.current !== null && detailSchoolId === null;
    prevDetailRef.current = detailSchoolId;

    if (detailSchoolId !== null) {
      const sName =
        schools.find((s) => s.id === detailSchoolId)?.name ??
        (fetchedDetailSchool && fetchedDetailSchool.id === detailSchoolId
          ? fetchedDetailSchool.name
          : null);
      const target = buildSchoolPath(detailSchoolId, sName);
      if (window.location.pathname !== target) {
        if (transitioningToDetail && !onSchoolPath) {
          window.history.pushState(null, '', target);
        } else {
          // Refining the slug after async load, or arrived directly via URL —
          // either way, replace in place.
          window.history.replaceState(null, '', target);
        }
      }
    } else {
      const search =
        encodeStateToSearch({
          tab: activeTab,
          filters,
          selectedIds: isLoggedIn ? [] : Array.from(selectedIds),
        }) || '';
      const target = `/app${search}`;
      const onApp = window.location.pathname.startsWith('/app');
      if (window.location.pathname + window.location.search !== target) {
        if (transitioningFromDetail && onSchoolPath) {
          window.history.pushState(null, '', target);
        } else if (!onApp) {
          window.history.replaceState(null, '', target);
        } else {
          window.history.replaceState(null, '', target);
        }
      }
    }
  }, [
    activeTab,
    filters,
    selectedIds,
    detailSchoolId,
    isLoggedIn,
    schools,
    fetchedDetailSchool,
    studentView.kind,
  ]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {
        // ignore failure (e.g. permission denied)
      },
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setProgress(null);
    searchAllSchools(filters, {
      signal: controller.signal,
      onProgress: (p) => {
        if (controller.signal.aborted) return;
        setProgress(p);
        setSchools((cur) => (cur.length === 0 ? cur : cur));
      },
    })
      .then((r) => {
        if (controller.signal.aborted) return;
        setSchools(r.schools);
        setTotal(r.total);
      })
      .catch((e: Error) => {
        if (controller.signal.aborted || e.name === 'AbortError') return;
        setError(e.message);
        setSchools([]);
        setTotal(0);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setProgress(null);
        }
      });
    return () => {
      controller.abort();
    };
  }, [filters]);

  // Resolve the school for the detail view: prefer the in-filter copy,
  // else fall back to a direct fetch by ID (deep-link case).
  const detailSchool = useMemo(() => {
    if (detailSchoolId === null) return null;
    const inFilter = schools.find((s) => s.id === detailSchoolId);
    if (inFilter) return inFilter;
    if (fetchedDetailSchool && fetchedDetailSchool.id === detailSchoolId)
      return fetchedDetailSchool;
    return null;
  }, [detailSchoolId, schools, fetchedDetailSchool]);

  useEffect(() => {
    if (detailSchoolId === null) {
      setFetchedDetailSchool(null);
      setDetailError(null);
      return;
    }
    if (schools.find((s) => s.id === detailSchoolId)) {
      setFetchedDetailSchool(null);
      return;
    }
    if (fetchedDetailSchool && fetchedDetailSchool.id === detailSchoolId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    fetchSchoolById(detailSchoolId)
      .then((s) => {
        if (!cancelled) setFetchedDetailSchool(s);
      })
      .catch((e: Error) => {
        if (!cancelled) setDetailError(e.message);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailSchoolId, schools]);

  const toggleSelect = (id: number) => {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      const wasPinned = next.has(id);
      if (wasPinned) next.delete(id);
      else if (next.size < 5) next.add(id);
      // Mirror the change to the server when logged in.
      if (isLoggedIn) {
        // Find a school name for the pin — try filtered list first, then detail.
        const school =
          schools.find((s) => s.id === id) ??
          (fetchedDetailSchool && fetchedDetailSchool.id === id ? fetchedDetailSchool : null);
        const name = school?.name ?? `School ${id}`;
        if (wasPinned) {
          removePin(id).catch(() => {});
        } else if (next.has(id)) {
          addPin(id, name).catch(() => {});
        }
      }
      return next;
    });
  };

  const selectedSchools = useMemo(
    () => schools.filter((s) => selectedIds.has(s.id)),
    [schools, selectedIds],
  );

  const clearSelected = () => setSelectedIds(new Set());
  const removeSelected = (id: number) =>
    setSelectedIds((cur) => {
      const next = new Set(cur);
      next.delete(id);
      return next;
    });

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">
              <a href="/" className="hover:text-slate-200">
                College Trends
              </a>
            </h1>
            <p className="text-xs text-slate-300 hidden sm:block">
              Interactive visualizations powered by the U.S. Dept. of Education College Scorecard API.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {isLoggedIn && (
              <>
                <button
                  onClick={() =>
                    navigateStudents(studentView.kind === 'none' ? { kind: 'roster' } : { kind: 'none' })
                  }
                  className={`px-2.5 py-1 rounded transition ${
                    studentView.kind !== 'none'
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {studentView.kind !== 'none' ? '← Dashboard' : '👥 Students'}
                </button>
                <span className="text-slate-300" title={session?.user?.email}>
                  {session?.user?.name ?? session?.user?.email}
                </span>
                <button
                  onClick={async () => {
                    await signOut();
                    window.location.href = '/';
                  }}
                  className="text-slate-300 hover:text-white underline"
                >
                  Sign out
                </button>
              </>
            )}
            {AUTH_ENABLED && !isLoggedIn && (
              <a href="/login" className="text-slate-300 hover:text-white underline">
                Sign in
              </a>
            )}
            <a href="/about" className="text-slate-300 hover:text-white underline">
              About
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {studentView.kind === 'roster' ? (
          <StudentsPage
            onOpenStudent={(id) => navigateStudents({ kind: 'student', id })}
            onBack={() => navigateStudents({ kind: 'none' })}
          />
        ) : studentView.kind === 'student' ? (
          <StudentDetailPage
            studentId={studentView.id}
            onBack={() => navigateStudents({ kind: 'roster' })}
            onOpenSchoolDetail={(id) => {
              navigateStudents({ kind: 'none' });
              setDetailSchoolId(id);
            }}
          />
        ) : detailSchoolId !== null ? (
          <>
            {detailSchool ? (
              <SchoolDetail
                school={detailSchool}
                filterSchools={schools}
                onClose={() => setDetailSchoolId(null)}
                onToggleSelect={toggleSelect}
                isSelected={selectedIds.has(detailSchool.id)}
                copyShareLink={copyShareLink}
                copied={copied}
              />
            ) : detailLoading ? (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-sm">
                Loading school…
              </div>
            ) : detailError ? (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-4">
                <div className="font-medium">Couldn't load school</div>
                <div className="text-xs mt-1">{detailError}</div>
                <button
                  onClick={() => setDetailSchoolId(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-2"
                >
                  ← Back to filtered list
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-sm">
                School not found.
                <button
                  onClick={() => setDetailSchoolId(null)}
                  className="block mx-auto mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  ← Back to filtered list
                </button>
              </div>
            )}
          </>
        ) : (
          <MainView
            filters={filters}
            setFilters={setFilters}
            loading={loading}
            error={error}
            progress={progress}
            schools={schools}
            total={total}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            clearSelected={clearSelected}
            removeSelected={removeSelected}
            copyShareLink={copyShareLink}
            copied={copied}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedSchools={selectedSchools}
            onOpenDetail={(id) => setDetailSchoolId(id)}
          />
        )}
      </main>

      <footer className="text-xs text-slate-400 text-center py-6">
        Data: College Scorecard · api.data.gov
      </footer>
    </div>
  );
}

interface MainViewProps {
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  loading: boolean;
  error: string | null;
  progress: { loaded: number; total: number } | null;
  schools: School[];
  total: number;
  selectedIds: Set<number>;
  toggleSelect: (id: number) => void;
  clearSelected: () => void;
  removeSelected: (id: number) => void;
  copyShareLink: () => void;
  copied: boolean;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  selectedSchools: School[];
  onOpenDetail: (id: number) => void;
}

function MainView({
  filters,
  setFilters,
  loading,
  error,
  progress,
  schools,
  total,
  selectedIds,
  toggleSelect,
  clearSelected,
  removeSelected,
  copyShareLink,
  copied,
  activeTab,
  setActiveTab,
  selectedSchools,
  onOpenDetail,
}: MainViewProps) {
  return (
    <>
      <StarterPresets currentFilters={filters} onApply={setFilters} />
      <Filters initial={filters} onApply={setFilters} loading={loading} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
            <div className="font-medium">Couldn't load data</div>
            <div className="text-xs mt-1">{error}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-600">
          <div>
            {loading && progress ? (
              <span>
                Loading{' '}
                <span className="font-semibold text-slate-900">
                  {progress.loaded.toLocaleString()}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {progress.total.toLocaleString()}
                </span>{' '}
                schools…
              </span>
            ) : (
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {schools.length.toLocaleString()}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>{' '}
                schools matching filters.
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size >= 2 ? (
              <button
                onClick={() => setActiveTab('compare')}
                className="text-xs px-2.5 py-1.5 rounded-md border font-medium transition whitespace-nowrap bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400"
                title="Open the Compare tab to see all pinned schools side-by-side"
              >
                📌 Compare {selectedIds.size}
              </button>
            ) : (
              <span
                className="text-xs text-slate-500 hidden md:inline"
                title="Pinned schools appear in per-school breakdowns across every tab. Pick up to 5."
              >
                {selectedIds.size === 1
                  ? '📌 1 pinned · pin one more to compare'
                  : '📌 Pin schools to compare (up to 5)'}
              </span>
            )}
            <button
              onClick={copyShareLink}
              className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition whitespace-nowrap ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400'
              }`}
              title="Copy a shareable link that re-creates this exact view"
            >
              {copied ? '✓ Copied' : '🔗 Share'}
              <span className="hidden sm:inline">
                {copied ? ' link' : ' link to this view'}
              </span>
            </button>
            <button
              onClick={() => downloadSchoolsCsv(schools, filters, activeTab)}
              disabled={loading || schools.length === 0}
              className="text-xs px-2.5 py-1.5 rounded-md border font-medium transition bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              title={`Download ${schools.length.toLocaleString()} schools × ${getColumnCount(activeTab)} columns relevant to the ${activeTab} tab`}
            >
              📥 CSV
              <span className="hidden sm:inline">
                {' '}
                ({schools.length.toLocaleString()} × {getColumnCount(activeTab)} cols)
              </span>
            </button>
          </div>
        </div>

        {loading && progress && progress.total > 0 && (
          <div className="h-1 bg-slate-200 rounded overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(100, (progress.loaded / progress.total) * 100)}%` }}
            />
          </div>
        )}

        <SuppressionNote />

        <div>
          <div className="border-b border-slate-200 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <nav className="flex gap-1 min-w-max">
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
                      active
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <p className="text-xs text-slate-500 mt-2 px-1">
            {TABS.find((t) => t.id === activeTab)?.description}
          </p>
        </div>

        {activeTab === 'overview' && (
          <OverviewTab
            schools={schools}
            selectedSchools={selectedSchools}
            onClearSelected={clearSelected}
            onRemoveSelected={removeSelected}
          />
        )}
        {activeTab === 'compare' && (
          <CompareTab selectedSchools={selectedSchools} />
        )}
        {activeTab === 'map' && (
          <MapTab
            schools={schools}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}
        {activeTab === 'debt' && (
          <DebtRepaymentTab schools={schools} selectedSchools={selectedSchools} />
        )}
        {activeTab === 'trends' && (
          <TrendsTab filters={filters} selectedSchools={selectedSchools} />
        )}
        {activeTab === 'majors' && <MajorsTab selectedSchools={selectedSchools} />}
        {activeTab === 'demographics' && (
          <DemographicsTab schools={schools} selectedSchools={selectedSchools} />
        )}
        {activeTab === 'outcomes' && (
          <OutcomesTab schools={schools} selectedSchools={selectedSchools} />
        )}
        {activeTab === 'selectivity' && (
          <SelectivityTab schools={schools} selectedSchools={selectedSchools} />
        )}
        {activeTab === 'earnings' && (
          <EarningsDistributionTab
            schools={schools}
            selectedSchools={selectedSchools}
          />
        )}
        {activeTab === 'retention' && (
          <RetentionTab schools={schools} selectedSchools={selectedSchools} />
        )}
        {activeTab === 'loanaid' && (
          <LoanAidTab schools={schools} selectedSchools={selectedSchools} />
        )}
        {activeTab === 'faculty' && (
          <FacultyTab schools={schools} selectedSchools={selectedSchools} />
        )}

        <ResultsTable
          schools={schools}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onOpenDetail={onOpenDetail}
        />
    </>
  );
}
