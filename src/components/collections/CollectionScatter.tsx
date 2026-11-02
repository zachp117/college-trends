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
import { METRICS, schoolPath, type CollectionRow, type RowMetric } from '../../seo/collectionContent';

interface Props {
  /** Every school in the collection, nationwide. */
  rows: CollectionRow[];
  /** Two-letter code: highlight this state against the national field. */
  stateCode: string | null;
  stateName: string | null;
  noun: string;
  options: RowMetric[];
}

interface Point {
  x: number;
  y: number;
  row: CollectionRow;
}

const FOCUS = '#0c7cbe'; // indigo-500 (brand cyan ramp)
const CONTEXT = '#cbd5e1'; // slate-300

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * One dot per school. On state pages the state's schools are highlighted over the
 * national field in gray. Static HTML (no JS) shows a placeholder instead.
 */
export function CollectionScatter({ rows, stateCode, stateName, noun, options }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [xKey, setXKey] = useState<RowMetric>('netPrice');
  const [yKey, setYKey] = useState<RowMetric>('earnings10');
  const [showContext, setShowContext] = useState(true);

  const { focus, context, focusTotal } = useMemo(() => {
    const focus: Point[] = [];
    const context: Point[] = [];
    let focusTotal = 0;
    for (const r of rows) {
      const inFocus = !stateCode || r.state === stateCode;
      if (inFocus) focusTotal++;
      const x = r[xKey];
      const y = r[yKey];
      if (x === null || y === null) continue;
      (inFocus ? focus : context).push({ x, y, row: r });
    }
    return { focus, context, focusTotal };
  }, [rows, stateCode, xKey, yKey]);

  const medX = median(focus.map((p) => p.x));
  const medY = median(focus.map((p) => p.y));
  const xDef = METRICS[xKey];
  const yDef = METRICS[yKey];
  const axisOptions = [...options, 'size' as RowMetric].filter((k, i, a) => a.indexOf(k) === i);
  const place = stateName ?? 'the U.S.';
  const dotSize = stateCode ? 70 : focus.length > 800 ? 22 : 34;

  const select = (value: RowMetric, onChange: (k: RowMetric) => void, label: string) => (
    <label className="text-xs text-slate-500 flex items-center gap-2">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RowMetric)}
        className="text-sm text-slate-800 border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        {axisOptions.map((k) => (
          <option key={k} value={k}>
            {METRICS[k].label}
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
        {stateCode && (
          <label className="text-xs text-slate-600 flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showContext}
              onChange={(e) => setShowContext(e.target.checked)}
              className="accent-indigo-600"
            />
            Show all U.S. {noun} in gray
          </label>
        )}
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
              {stateCode && showContext && (
                <Scatter
                  data={context}
                  fill={CONTEXT}
                  fillOpacity={0.7}
                  isAnimationActive={false}
                  onClick={(d: { payload?: Point }) => {
                    if (d.payload) window.location.href = schoolPath(d.payload.row);
                  }}
                  className="cursor-pointer"
                />
              )}
              <Scatter
                data={focus}
                fill={FOCUS}
                fillOpacity={stateCode ? 0.9 : 0.55}
                isAnimationActive={false}
                onClick={(d: { payload?: Point }) => {
                  if (d.payload) window.location.href = schoolPath(d.payload.row);
                }}
                className="cursor-pointer"
              />
              {medX !== null && (
                <ReferenceLine x={medX} stroke="#64748b" strokeDasharray="4 4" ifOverflow="extendDomain" />
              )}
              {medY !== null && (
                <ReferenceLine y={medY} stroke="#64748b" strokeDasharray="4 4" ifOverflow="extendDomain" />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center rounded-md bg-slate-50 text-sm text-slate-400">
            Interactive chart loads in your browser.
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-2">
        Each dot is one school. Dashed lines mark the median for {place}. Showing {focus.length.toLocaleString()} of{' '}
        {focusTotal.toLocaleString()} {noun} in {place}; schools missing either value are left out.
      </p>
    </div>
  );
}
