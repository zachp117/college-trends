import type { SearchFilters } from '../api/scorecard';
import { STARTER_PRESETS, isPresetActive } from '../data/presets';

interface Props {
  currentFilters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

export function StarterPresets({ currentFilters, onApply }: Props) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-slate-700">Quick starts</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          one-click views
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STARTER_PRESETS.map((p) => {
          const active = isPresetActive(currentFilters, p);
          return (
            <button
              key={p.id}
              onClick={() =>
                onApply({
                  ...p.filters,
                  // Preserve any name/state the user typed — presets only
                  // change ownership/degree/size dimensions
                  name: currentFilters.name,
                  state: currentFilters.state,
                })
              }
              title={p.description}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition whitespace-nowrap ${
                active
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
