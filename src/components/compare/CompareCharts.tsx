import { useRef, useState, type ReactNode } from 'react';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { School } from '../../api/scorecard';
import { INCOME_BRACKETS } from '../../api/scorecard';
import { fmtMoney, fmtPct } from '../../util/format';
import { SCHOOL_COLORS } from '../../util/schoolColors';
import { downloadChartPng, type ExportLegendItem } from '../../util/chartExport';

interface Props {
  /** Pinned schools, in pin order (that order sets each school's color). */
  schools: School[];
}

const AXIS = '#64748b';
const GRID = '#e2e8f0';

const kMoney = (v: number) => (v === 0 ? '$0' : `$${Math.round(v / 1000)}k`);
const wholePct = (v: number) => `${Math.round(v * 100)}%`;

/** One-line school name on the bar charts' axis, cut to fit. */
function NameTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#334155">
      {payload?.value}
    </text>
  );
}

function shortName(name: string, max = 28): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function fileSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface MetricChart {
  key: string;
  title: string;
  subtitle: string;
  value: (s: School) => number | null;
  format: (v: number) => string;
  tick: (v: number) => string;
}

const METRIC_CHARTS: MetricChart[] = [
  {
    key: 'net-price',
    title: 'Average net price',
    subtitle: 'Yearly cost after grants and scholarships, for full-time, first-time students receiving federal aid.',
    value: (s) => s.avgCost,
    format: fmtMoney,
    tick: kMoney,
  },
  {
    key: 'earnings',
    title: 'Median earnings 10 years after entry',
    subtitle: 'Former students who received federal aid, working and not enrolled.',
    value: (s) => s.medianEarnings10,
    format: fmtMoney,
    tick: kMoney,
  },
  {
    key: 'debt',
    title: 'Median debt at graduation',
    subtitle: 'Federal student loans of graduates. Excludes Parent PLUS and private loans.',
    value: (s) => s.medianDebt,
    format: fmtMoney,
    tick: kMoney,
  },
  {
    key: 'grad-rate',
    title: 'Graduation rate',
    subtitle: 'Full-time, first-time students finishing within 150% of normal time.',
    value: (s) => s.completionRate ?? s.completionRateLt4,
    format: fmtPct,
    tick: wholePct,
  },
  {
    key: 'retention',
    title: 'First-year retention',
    subtitle: 'Full-time, first-time students who came back for a second year.',
    value: (s) => s.retentionFt4yr ?? s.retentionFtLt4yr,
    format: fmtPct,
    tick: wholePct,
  },
  {
    key: 'admit-rate',
    title: 'Admission rate',
    subtitle: 'Share of applicants admitted. Open-admission schools usually report none.',
    value: (s) => s.admissionRate,
    format: fmtPct,
    tick: wholePct,
  },
];

/**
 * Auto-generated charts for the pinned schools on the Compare view. Each chart
 * can be saved as a PNG that carries its own title, legend and source line.
 */
export function CompareCharts({ schools }: Props) {
  const legend: ExportLegendItem[] = schools.map((s, i) => ({ label: s.name, color: SCHOOL_COLORS[i] }));
  const names = schools.map((s) => s.name).join(' vs. ');

  return (
    <section aria-labelledby="compare-charts-heading" className="space-y-4">
      <div>
        <h2 id="compare-charts-heading" className="text-lg font-semibold text-slate-900">
          Charts
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Built from your pinned schools. Use Download PNG to save any chart with its title, legend and source.
        </p>
      </div>

      <IncomeChart schools={schools} legend={legend} names={names} />

      <div className="grid gap-4 md:grid-cols-2">
        {METRIC_CHARTS.map((m) => (
          <MetricBars key={m.key} metric={m} schools={schools} names={names} />
        ))}
      </div>
    </section>
  );
}

function ChartCard({
  title,
  subtitle,
  legend,
  filename,
  children,
  footnote,
  className = '',
}: {
  title: string;
  subtitle: string;
  legend?: ExportLegendItem[];
  filename: string;
  children: ReactNode;
  footnote?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');

  const save = async () => {
    if (!ref.current) return;
    setState('busy');
    try {
      await downloadChartPng({ container: ref.current, title, subtitle, legend, filename });
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm p-4 print-keep ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={state === 'busy'}
          className="no-print shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:border-slate-400 disabled:opacity-60 transition"
        >
          <Download size={13} strokeWidth={1.75} aria-hidden="true" />
          {state === 'busy' ? 'Saving…' : 'Download PNG'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-xs text-red-600 mt-1">Couldn't save the image. Please try again.</p>
      )}
      {legend && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-slate-700">
          {legend.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: l.color }} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className="mt-3">
        {children}
      </div>
      {footnote && <p className="text-xs text-slate-400 mt-2">{footnote}</p>}
    </div>
  );
}

function IncomeChart({ schools, legend, names }: { schools: School[]; legend: ExportLegendItem[]; names: string }) {
  const data = INCOME_BRACKETS.map((b) => {
    const row: Record<string, string | number | null> = { bracket: b.label };
    schools.forEach((s, i) => {
      row[`s${i}`] = s.netPriceByIncome[b.key] ?? null;
    });
    return row;
  });
  const missing = schools.filter((s) => INCOME_BRACKETS.every((b) => s.netPriceByIncome[b.key] == null));

  return (
    <ChartCard
      title="Net price by family income"
      subtitle="Average yearly cost after grants and scholarships, by family income. Students receiving federal aid; public schools report in-state students."
      legend={legend}
      filename={`net-price-by-income-${fileSlug(names).slice(0, 60)}`}
      footnote={
        missing.length
          ? `No income breakdown reported for ${missing.map((s) => s.name).join(', ')}.`
          : undefined
      }
    >
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barGap={2} barCategoryGap="18%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="bracket" stroke={AXIS} fontSize={12} tickLine={false} />
          <YAxis stroke={AXIS} fontSize={12} tickFormatter={kMoney} width={48} tickLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.12)' }}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
            formatter={(v, key) => {
              const i = Number(String(key).slice(1));
              return [v == null ? 'n/a' : fmtMoney(Number(v)), schools[i]?.name ?? ''];
            }}
          />
          {schools.map((s, i) => (
            <Bar key={s.id} dataKey={`s${i}`} name={s.name} fill={SCHOOL_COLORS[i]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function MetricBars({ metric: m, schools, names }: { metric: MetricChart; schools: School[]; names: string }) {
  const data = schools.map((s, i) => ({
    name: shortName(s.name),
    // Recharts needs unique category values; keep duplicates (same short name) apart.
    key: `${i}`,
    full: s.name,
    value: m.value(s),
    color: SCHOOL_COLORS[i],
  }));
  const reported = data.filter((d) => d.value !== null);
  const notReported = data.filter((d) => d.value === null);
  const isRate = m.tick === wholePct;

  return (
    <ChartCard
      title={m.title}
      subtitle={m.subtitle}
      filename={`${m.key}-${fileSlug(names).slice(0, 60)}`}
      footnote={notReported.length ? `Not reported: ${notReported.map((d) => d.full).join(', ')}.` : undefined}
    >
      {reported.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-sm text-slate-400">
          None of these schools report this.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34 + 24)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 4 }} barCategoryGap={6}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis
              type="number"
              stroke={AXIS}
              fontSize={11}
              tickFormatter={m.tick}
              domain={isRate ? [0, 1] : [0, 'auto']}
              ticks={isRate ? [0, 0.25, 0.5, 0.75, 1] : undefined}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="key"
              stroke={AXIS}
              width={196}
              tickLine={false}
              interval={0}
              tick={(props: { x?: number; y?: number; payload?: { value: string } }) => (
                <NameTick {...props} payload={{ value: data[Number(props.payload?.value)]?.name ?? '' }} />
              )}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.12)' }}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
              formatter={(v) => [v == null ? 'n/a' : m.format(Number(v)), m.title]}
              labelFormatter={(_, p) => (p?.[0]?.payload as { full?: string } | undefined)?.full ?? ''}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.full} fill={d.color} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                fontSize={12}
                fill="#334155"
                formatter={(v: unknown) => (v == null ? 'n/a' : m.format(Number(v)))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
