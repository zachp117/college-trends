import { useState } from 'react';
import { FIELD_VINTAGES } from '../util/dataVintage';

/**
 * Persistent inline note explaining (a) why some cells show "—" and
 * (b) how recent the underlying data actually is. Both are top
 * questions counselors and parents have when first using the tool.
 */
export function SuppressionNote() {
  const [openVintage, setOpenVintage] = useState(false);
  return (
    <div className="text-xs text-slate-500 bg-slate-100/70 border border-slate-200 rounded-md px-3 py-2 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-slate-400 font-semibold mt-px">ⓘ</span>
        <span>
          <span className="font-medium text-slate-700">Why are some cells empty?</span>{' '}
          Values shown as <span className="font-mono text-slate-700">—</span> were either
          not reported or suppressed by the U.S. Dept. of Education to protect student
          privacy when the underlying cohort had fewer than ~30 students. This is normal
          for small schools, test-optional schools, and any field tracked through federal
          financial-aid records.
        </span>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-slate-400 font-semibold mt-px">📅</span>
        <div className="flex-1">
          <button
            onClick={() => setOpenVintage((v) => !v)}
            className="font-medium text-slate-700 hover:text-indigo-700"
          >
            How recent is this data? {openVintage ? '▾' : '▸'}
          </button>
          {openVintage && (
            <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {FIELD_VINTAGES.map((v) => (
                <div key={v.family} className="flex justify-between gap-4">
                  <span className="text-slate-600">{v.family}</span>
                  <span className="font-medium text-slate-800 whitespace-nowrap">
                    {v.year}
                    {v.note && (
                      <span className="text-slate-400 font-normal"> · {v.note}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
