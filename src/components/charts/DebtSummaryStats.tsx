import type { School } from '../../api/scorecard';
import { fmtMoney, fmtPct } from '../../util/format';
import { InfoTooltip } from '../InfoTooltip';

interface Props {
  schools: School[];
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function DebtSummaryStats({ schools }: Props) {
  const debts = schools.map((s) => s.medianDebt).filter((v): v is number => v !== null);
  const loanRates = schools
    .map((s) => s.federalLoanRate)
    .filter((v): v is number => v !== null);
  const pellRates = schools.map((s) => s.pellGrantRate).filter((v): v is number => v !== null);
  const defaults = schools
    .map((s) => s.defaultRate3yr)
    .filter((v): v is number => v !== null);
  const repay5 = schools
    .map((s) => s.repayment.yr5Comp)
    .filter((v): v is number => v !== null);

  const stats = [
    {
      label: 'Typical debt at graduation',
      tip: 'student-debt',
      value: fmtMoney(median(debts)),
      n: debts.length,
    },
    {
      label: '% of students borrowing',
      tip: 'federal-loan-rate',
      value: fmtPct(median(loanRates)),
      n: loanRates.length,
    },
    {
      label: '% on Pell grants',
      tip: 'pell-rate',
      value: fmtPct(median(pellRates)),
      n: pellRates.length,
    },
    {
      label: '% who default (3 yrs)',
      tip: 'default-rate',
      value: fmtPct(median(defaults)),
      n: defaults.length,
    },
    {
      label: '% paying down loans (5 yrs)',
      tip: 'repayment-rate',
      value: fmtPct(median(repay5)),
      n: repay5.length,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-3"
        >
          <div className="text-xs text-slate-500 inline-flex items-center">
            {s.label}
            <InfoTooltip term={s.tip} />
          </div>
          <div className="text-xl font-semibold text-slate-900 tabular-nums mt-1">
            {s.value}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            median across {s.n} schools
          </div>
        </div>
      ))}
    </div>
  );
}
