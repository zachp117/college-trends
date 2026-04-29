import { GLOSSARY } from '../util/glossary';

interface Props {
  /** Glossary key (preferred) — pulls definition from src/util/glossary.ts */
  term?: string;
  /** Or pass arbitrary text (overrides term lookup) */
  text?: string;
  /** Tooltip placement; default is 'top' */
  placement?: 'top' | 'bottom';
  className?: string;
}

export function InfoTooltip({ term, text, placement = 'top', className }: Props) {
  const body = text ?? (term ? GLOSSARY[term] : '');
  if (!body) return null;

  const positionClass =
    placement === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
      : 'top-full left-1/2 -translate-x-1/2 mt-2';

  return (
    <span className={`relative inline-flex group align-baseline ${className ?? ''}`}>
      <span
        tabIndex={0}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold cursor-help hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="More info"
      >
        i
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${positionClass} z-50 w-64 px-2.5 py-2 bg-slate-900 text-white text-[11px] leading-snug rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100`}
      >
        {body}
      </span>
    </span>
  );
}
