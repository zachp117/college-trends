import { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'ct-accordion:';

function loadState(id: string, defaultOpen: boolean): boolean {
  if (typeof window === 'undefined') return defaultOpen;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + id);
    if (raw === null) return defaultOpen;
    return raw === '1';
  } catch {
    return defaultOpen;
  }
}

function saveState(id: string, open: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + id, open ? '1' : '0');
  } catch {
    // ignore
  }
}

interface AccordionSectionProps {
  /** Stable ID used as the localStorage key — must be unique across the app. */
  id: string;
  title: string;
  /** Short context line shown next to the title. */
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({
  id,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: AccordionSectionProps) {
  const [open, setOpen] = useState<boolean>(() => loadState(id, defaultOpen));

  useEffect(() => {
    saveState(id, open);
  }, [id, open]);

  return (
    <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <Chevron open={open} />
      </button>
      {open && (
        <div
          className={
            // Flatten any direct-child card so it merges with the accordion shell:
            // strip its bg / border / shadow / rounding / padding, hide its duplicate title.
            'border-t border-slate-100 ' +
            '[&>div]:!bg-transparent [&>div]:!border-0 [&>div]:!shadow-none ' +
            '[&>div]:!rounded-none [&>div]:!p-4 ' +
            '[&>div>h3:first-child]:!hidden ' +
            '[&>div>h3:first-child+p]:!mt-0'
          }
        >
          {children}
        </div>
      )}
    </section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 text-slate-400 transition-transform ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path
        d="M5 7.5l5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface AccordionProps {
  children: React.ReactNode;
}

/** Wrapper that stacks accordion sections with consistent spacing. */
export function Accordion({ children }: AccordionProps) {
  return <div className="space-y-3">{children}</div>;
}
