import { InfoTooltip } from './InfoTooltip';

interface Props {
  label: string;
  value: string;
  sub?: string;
  /** Glossary term key — adds an info tooltip next to the label */
  tip?: string;
}

export function StatCard({ label, value, sub, tip }: Props) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
      <div className="text-xs text-slate-500 inline-flex items-center">
        {label}
        {tip && <InfoTooltip term={tip} />}
      </div>
      <div className="text-xl font-semibold text-slate-900 tabular-nums mt-1">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
