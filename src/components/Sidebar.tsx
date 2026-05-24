import { useEffect, useState } from 'react';

export type SidebarTabId =
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

interface SidebarItem {
  id: SidebarTabId;
  label: string;
  hint?: string;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Summary' },
      { id: 'map', label: 'Map' },
      { id: 'compare', label: 'Compare', hint: '📌' },
    ],
  },
  {
    label: 'Cost & Aid',
    items: [
      { id: 'selectivity', label: 'Admissions' },
      { id: 'loanaid', label: 'Loans & Aid' },
      { id: 'debt', label: 'Debt & Repayment' },
    ],
  },
  {
    label: 'Outcomes',
    items: [
      { id: 'earnings', label: 'Earnings' },
      { id: 'retention', label: 'Retention' },
      { id: 'outcomes', label: 'By student type' },
    ],
  },
  {
    label: 'Who Attends',
    items: [
      { id: 'demographics', label: 'Demographics' },
      { id: 'faculty', label: 'Faculty' },
    ],
  },
  {
    label: 'Deep Dives',
    items: [
      { id: 'trends', label: 'Trends' },
      { id: 'majors', label: 'Majors' },
    ],
  },
];

interface SidebarProps {
  activeTab: SidebarTabId;
  onSelect: (id: SidebarTabId) => void;
}

export function Sidebar({ activeTab, onSelect }: SidebarProps) {
  return (
    <nav className="text-sm">
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.label} className="mb-4">
          <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelect(item.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center gap-2 transition ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.hint && <span className="text-xs">{item.hint}</span>}
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

interface SidebarLayoutProps {
  activeTab: SidebarTabId;
  onSelectTab: (id: SidebarTabId) => void;
  children: React.ReactNode;
}

/**
 * Two-column layout: sticky sidebar (desktop) / drawer (mobile) + main content.
 */
export function SidebarLayout({ activeTab, onSelectTab, children }: SidebarLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer when switching to desktop width
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setDrawerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [drawerOpen]);

  const handleSelect = (id: SidebarTabId) => {
    onSelectTab(id);
    setDrawerOpen(false);
  };

  return (
    <div className="md:flex md:gap-6">
      {/* Mobile: hamburger button + current view label */}
      <div className="md:hidden mb-3 flex items-center gap-3 no-print">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-slate-100 text-slate-700"
          aria-label="Open navigation menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="text-sm font-medium text-slate-700">
          {findItemLabel(activeTab)}
        </span>
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden md:block md:w-56 md:flex-shrink-0 no-print">
        <div className="sticky top-4">
          <Sidebar activeTab={activeTab} onSelect={onSelectTab} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 no-print">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-64 max-w-[80%] h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Views</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
                aria-label="Close navigation menu"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <Sidebar activeTab={activeTab} onSelect={handleSelect} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function findItemLabel(id: SidebarTabId): string {
  for (const group of SIDEBAR_GROUPS) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item.label;
  }
  return '';
}
