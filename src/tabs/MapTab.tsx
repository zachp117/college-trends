import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { geoAlbersUsa } from 'd3-geo';
import type { School } from '../api/scorecard';
import { fmtMoney, fmtNum, fmtPct } from '../util/format';
import { Accordion, AccordionSection } from '../components/Accordion';

interface Props {
  schools: School[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
}

const US_TOPOJSON = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';
const MAP_WIDTH = 975;
const MAP_HEIGHT = 610;
const PROJECTION_SCALE = 1000;

type MapMetricKey =
  | 'avgCost'
  | 'tuitionIn'
  | 'tuitionOut'
  | 'medianEarnings10'
  | 'admissionRate'
  | 'completionRate'
  | 'medianDebt'
  | 'defaultRate3yr'
  | 'size'
  | 'ownership';

interface MapMetric {
  key: MapMetricKey;
  label: string;
  format: 'money' | 'pct' | 'num' | 'categorical';
  scale: 'linear' | 'log' | 'categorical';
  lowColor: string;
  highColor: string;
}

const MAP_METRICS: MapMetric[] = [
  { key: 'avgCost', label: 'Avg net price', format: 'money', scale: 'linear', lowColor: '#dcfce7', highColor: '#E0483D' },
  { key: 'tuitionIn', label: 'In-state tuition', format: 'money', scale: 'linear', lowColor: '#dcfce7', highColor: '#E0483D' },
  { key: 'tuitionOut', label: 'Out-of-state tuition', format: 'money', scale: 'linear', lowColor: '#dcfce7', highColor: '#E0483D' },
  { key: 'medianEarnings10', label: 'Median earnings (10y)', format: 'money', scale: 'linear', lowColor: '#fbd7d4', highColor: '#16A34A' },
  { key: 'admissionRate', label: 'Admission rate', format: 'pct', scale: 'linear', lowColor: '#6D5EF0', highColor: '#e7e4fd' },
  { key: 'completionRate', label: 'Completion rate', format: 'pct', scale: 'linear', lowColor: '#fbd7d4', highColor: '#16A34A' },
  { key: 'medianDebt', label: 'Median debt', format: 'money', scale: 'linear', lowColor: '#dcfce7', highColor: '#E0483D' },
  { key: 'defaultRate3yr', label: '3-yr default rate', format: 'pct', scale: 'linear', lowColor: '#dcfce7', highColor: '#E0483D' },
  { key: 'size', label: 'Enrollment', format: 'num', scale: 'log', lowColor: '#e7e4fd', highColor: '#6D5EF0' },
  { key: 'ownership', label: 'Ownership type', format: 'categorical', scale: 'categorical', lowColor: '', highColor: '' },
];

const OWNERSHIP_COLOR: Record<number, string> = {
  1: '#2F6FEB',
  2: '#16A34A',
  3: '#E0483D',
};

function lerpColor(c1: string, c2: string, t: number): string {
  const parse = (c: string) => {
    const h = c.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function formatVal(v: number | null, format: MapMetric['format']): string {
  if (v === null || v === undefined) return '—';
  if (format === 'money') return fmtMoney(v);
  if (format === 'pct') return fmtPct(v);
  return fmtNum(v);
}

interface Hovered {
  school: School;
  x: number;
  y: number;
  value: number | null;
}

interface PlottedSchool {
  school: School;
  x: number;
  y: number;
}

export function MapTab({ schools, selectedIds, onToggleSelect }: Props) {
  const [metric, setMetric] = useState<MapMetricKey>('avgCost');
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const metricDef = MAP_METRICS.find((m) => m.key === metric)!;

  // Project once, filter out anything AlbersUSA can't render
  const plotted: PlottedSchool[] = useMemo(() => {
    const projection = geoAlbersUsa()
      .scale(PROJECTION_SCALE)
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
    const out: PlottedSchool[] = [];
    for (const s of schools) {
      if (s.latitude === null || s.longitude === null) continue;
      if (s.latitude === 0 && s.longitude === 0) continue;
      const p = projection([s.longitude, s.latitude]);
      if (!p) continue;
      if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
      out.push({ school: s, x: p[0], y: p[1] });
    }
    return out;
  }, [schools]);

  const skipped = schools.length - plotted.length;

  const { minV, maxV } = useMemo(() => {
    if (metric === 'ownership') return { minV: 0, maxV: 0 };
    const vals = plotted
      .map((p) => p.school[metric as keyof School] as number | null)
      .filter((v): v is number => v !== null && v > 0);
    if (vals.length === 0) return { minV: 0, maxV: 0 };
    if (metricDef.scale === 'log') {
      return {
        minV: Math.log(Math.max(1, Math.min(...vals))),
        maxV: Math.log(Math.max(...vals)),
      };
    }
    const sorted = [...vals].sort((a, b) => a - b);
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    return { minV: p5, maxV: p95 };
  }, [plotted, metric, metricDef]);

  const colorForSchool = (s: School): string => {
    if (metric === 'ownership') {
      return OWNERSHIP_COLOR[s.ownership] ?? '#94a3b8';
    }
    const raw = s[metric as keyof School] as number | null;
    if (raw === null || raw <= 0) return '#cbd5e1';
    const v = metricDef.scale === 'log' ? Math.log(raw) : raw;
    const t =
      maxV === minV ? 0.5 : Math.max(0, Math.min(1, (v - minV) / (maxV - minV)));
    return lerpColor(metricDef.lowColor, metricDef.highColor, t);
  };

  const sizeForSchool = (s: School): number => {
    if (s.size === null || s.size <= 0) return 2;
    return Math.max(2, Math.min(10, 2 + Math.log10(s.size / 100) * 2.5));
  };

  return (
    <Accordion>
      <AccordionSection id="map.heatmap" title="Map">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              {plotted.length.toLocaleString()} schools on the map
              {skipped > 0 && (
                <span className="text-slate-400 text-xs font-normal ml-2">
                  ({skipped.toLocaleString()} skipped: territories / missing coords)
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Circle size = enrollment · color = {metricDef.label.toLowerCase()} · click a dot to compare
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Color by</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MapMetricKey)}
              className="rounded border border-slate-300 px-2.5 py-1.5 text-sm bg-white"
            >
              {MAP_METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative" onMouseLeave={() => setHovered(null)}>
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: PROJECTION_SCALE }}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={US_TOPOJSON}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#f1f5f9"
                    stroke="#cbd5e1"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#f1f5f9' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>
            <g>
              {plotted.map(({ school, x, y }) => {
                const r = sizeForSchool(school);
                const selected = selectedIds.has(school.id);
                return (
                  <g key={school.id}>
                    {selected && (
                      <circle
                        cx={x}
                        cy={y}
                        r={r + 3}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={1.5}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={colorForSchool(school)}
                      fillOpacity={0.8}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) =>
                        setHovered({
                          school,
                          x: e.clientX,
                          y: e.clientY,
                          value: (school[metric as keyof School] as number | null) ?? null,
                        })
                      }
                      onMouseMove={(e) =>
                        setHovered({
                          school,
                          x: e.clientX,
                          y: e.clientY,
                          value: (school[metric as keyof School] as number | null) ?? null,
                        })
                      }
                      onClick={() => onToggleSelect(school.id)}
                    />
                  </g>
                );
              })}
            </g>
          </ComposableMap>

          {hovered && (
            <div
              className="pointer-events-none fixed bg-white border border-slate-300 rounded shadow-lg p-2 text-xs max-w-[260px] z-50"
              style={{
                left: hovered.x + 10,
                top: hovered.y + 10,
              }}
            >
              <div className="font-semibold text-slate-800">{hovered.school.name}</div>
              <div className="text-slate-500">
                {hovered.school.city}, {hovered.school.state}
              </div>
              <div className="mt-1 text-slate-700">
                {metricDef.label}:{' '}
                <span className="font-medium">
                  {metric === 'ownership'
                    ? hovered.school.ownership === 1
                      ? 'Public'
                      : hovered.school.ownership === 2
                        ? 'Private nonprofit'
                        : 'Private for-profit'
                    : formatVal(hovered.value, metricDef.format)}
                </span>
              </div>
              <div className="text-slate-500">
                Enrollment: {fmtNum(hovered.school.size)}
              </div>
              {selectedIds.has(hovered.school.id) && (
                <div className="mt-1 text-indigo-600 font-medium">
                  Selected — click to remove
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          {metric === 'ownership' ? (
            <div className="flex items-center gap-3">
              {Object.entries(OWNERSHIP_COLOR).map(([k, c]) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: c }} />
                  {k === '1'
                    ? 'Public'
                    : k === '2'
                      ? 'Private nonprofit'
                      : 'Private for-profit'}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {formatVal(
                  metricDef.scale === 'log' ? Math.exp(minV) : minV,
                  metricDef.format,
                )}
              </span>
              <div
                className="h-2 w-48 rounded"
                style={{
                  background: `linear-gradient(to right, ${metricDef.lowColor}, ${metricDef.highColor})`,
                }}
              />
              <span className="font-medium">
                {formatVal(
                  metricDef.scale === 'log' ? Math.exp(maxV) : maxV,
                  metricDef.format,
                )}
              </span>
              <span className="text-slate-400">(5th–95th percentile)</span>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span>Dot size:</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-[6px] h-[6px] rounded-full bg-slate-400" />
              1k
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-[12px] h-[12px] rounded-full bg-slate-400" />
              10k
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-[18px] h-[18px] rounded-full bg-slate-400" />
              50k+
            </span>
          </div>
        </div>
      </div>
      </AccordionSection>
    </Accordion>
  );
}
