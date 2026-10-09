import type { SearchFilters } from '../api/scorecard';
import { Building2, GraduationCap, Landmark, School, BookOpen, Globe, type LucideIcon } from 'lucide-react';
import { STARTER_PRESETS, isPresetActive } from '../data/presets';

const PRESET_ICONS: Record<string, LucideIcon> = {
  'public-4yr': Landmark,
  'private-nonprofit': GraduationCap,
  'large-flagships': Building2,
  'small-private': School,
  community: BookOpen,
  'all-4yr': Globe,
};

interface Props {
  currentFilters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}

export function StarterPresets({ currentFilters, onApply }: Props) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-slate-700">Quick starts</span>
        <span className="text-xs text-slate-400">One-click views</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STARTER_PRESETS.map((p) => {
          const active = isPresetActive(currentFilters, p);
          const Icon = PRESET_ICONS[p.id];
          return (
            <button
              key={p.id}
              onClick={() =>
                onApply({
                  ...p.filters,
                  // Preserve any name/state the user typed; presets only
                  // change ownership/degree/size dimensions
                  name: currentFilters.name,
                  state: currentFilters.state,
                })
              }
              title={p.description}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition whitespace-nowrap ${
                active
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden="true" />}
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
