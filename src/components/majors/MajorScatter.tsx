import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { MAJOR_METRICS, onePerInstitution, schoolPath, type MajorMetric, type MajorRow } from '../../seo/majorContent';

interface Props {
  /** Every school offering the major. */
  rows: MajorRow[];
  /** Schools matching the page's filters; null when no filter is set. */
  focusIds: Set<number> | null;
  focusLabel: string;
}

interface Point {
  x: number;
  y: number;
  row: MajorRow & { campuses: number };
}

const FOCUS = '#0c7cbe'; // indigo-500 (brand cyan ramp)
const CONTEXT = '#cbd5e1'; // slate-300
const OPTIONS: MajorMetric[] = ['debt', 'e1', 'e5', 'awards'];

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** One dot per school's program. With a filter set, other schools show in gray. */
export function MajorScatter({ rows, focusIds, focusLabel }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [xKey, setXKey] = useState<MajorMetric>('debt');
  const [yKey, setYKey] = useState<MajorMetric>('e5');

  const { focus, context, focusTotal } = useMemo(() => {
    // One dot per institution: branch campuses repeat their institution's figures.
    const inFocus = (r: MajorRow) => !focusIds || focusIds.has(r.id);
    const toPoints = (list: MajorRow[]) =>
      onePerInstitution(list).flatMap((r) => {
        const x = r[xKey];
        const y = r[yKey];
        return x === null || y === null ? [] : [{ x, y, row: r }];
      });
    const focusUnits = onePerInstitution(rows.filter(inFocus));
    const focusIdsInUnits = new Set(focusUnits.map((u) => u.ope6 ?? `id${u.id}`));
    return {
      focus: toPoints(rows.filter(inFocus)),
      // Gray dots: institutions with no campus in the filter.
      context: toPoints(rows.filter((r) => !inFocus(r) && !focusIdsInUnits.has(r.ope6 ?? `id${r.id}`))),
      focusTotal: focusUnits.length,
    };
  }, [rows, focusIds, xKey, yKey]);

  const medX = median(focus.map((p) => p.x));
  const medY = median(focus.map((p) => p.y));
  const xDef = MAJOR_METRICS[xKey];
  const yDef = MAJOR_METRICS[yKey];
  const dotSize = focusIds ? 60 : focus.length > 600 ? 22 : 34;
  const open = (d: { payload?: Point }) => {
    if (d.payload) window.location.href = schoolPath(d.payload.row);
  };

  const select = (value: MajorMetric, onChange: (k: MajorMetric) => void, label: string) => (
    <label className="text-xs text-slate-500 flex items-center gap-2">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MajorMetric)}
        className="text-sm text-slate-800 border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 max-w-[15rem]"
      >
        {OPTIONS.map((k) => (
          <option key={k} value={k}>
            {MAJOR_METRICS[k].label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
        {select(xKey, setXKey, 'Across')}
        {select(yKey, setYKey, 'Up')}
      </div>
      <div className="h-[380px] sm:h-[440px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 16, bottom: 28, left: 8 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="x"
                name={xDef.label}
                tickFormatter={xDef.tick}
                stroke="#64748b"
                fontSize={12}
                domain={['auto', 'auto']}
                label={{ value: xDef.label, position: 'insideBottom', offset: -18, fontSize: 12, fill: '#475569' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yDef.label}
                tickFormatter={yDef.tick}
                stroke="#64748b"
                fontSize={12}
                width={52}
                domain={['auto', 'auto']}
              />
              <ZAxis range={[dotSize, dotSize]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as Point;
                  return (
                    <div className="bg-white border border-slate-200 rounded-md p-2 text-xs shadow max-w-[16rem]">
                      <div className="font-medium text-slate-900">{p.row.name}</div>
                      <div className="text-slate-500">
                        {p.row.city}, {p.row.state}
                        {p.row.campuses > 1 && ` · figures shared by ${p.row.campuses} campuses`}
                      </div>
                      <div className="mt-1">
                        {xDef.short}: {xDef.format(p.x)}
                      </div>
                      <div>
                        {yDef.short}: {yDef.format(p.y)}
                      </div>
                      <div className="text-slate-400 mt-1">Click to open the school page</div>
                    </div>
                  );
                }}
              />
              {focusIds && (
                <Scatter
                  data={context}
                  fill={CONTEXT}
                  fillOpacity={0.7}
                  isAnimationActive={false}
                  onClick={open}
                  className="cursor-pointer"
                />
              )}
              <Scatter
                data={focus}
                fill={FOCUS}
                fillOpacity={focusIds ? 0.9 : 0.55}
                isAnimationActive={false}
                onClick={open}
                className="cursor-pointer"
              />
              {medX !== null && <ReferenceLine x={medX} stroke="#64748b" strokeDasharray="4 4" />}
              {medY !== null && <ReferenceLine y={medY} stroke="#64748b" strokeDasharray="4 4" />}
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center rounded-md bg-slate-50 text-sm text-slate-400">
            Interactive chart loads in your browser.
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Each dot is one institution's program; branch campuses share their institution's figures and appear as one
        dot. Dashed lines mark the median for {focusLabel}
        {focusIds ? '; other colleges show in gray' : ''}. Showing {focus.length.toLocaleString()} of{' '}
        {focusTotal.toLocaleString()}; programs missing either value are left out (the Scorecard withholds figures for
        small programs).
      </p>
    </div>
  );
}
