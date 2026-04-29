import type { SearchFilters } from '../api/scorecard';

export interface StarterPreset {
  id: string;
  label: string;
  /** One-sentence description shown on hover */
  description: string;
  /** Filter values to apply when the chip is clicked */
  filters: SearchFilters;
  /** Optional tab to switch to so the preset lands on a meaningful view */
  tab?: string;
}

/**
 * Curated starter views designed to give first-time visitors immediate footing.
 * Each preset answers a question someone might actually have ("show me public
 * flagships", "what about small private colleges?") rather than just being a
 * filter convenience.
 */
export const STARTER_PRESETS: StarterPreset[] = [
  {
    id: 'public-4yr',
    label: '🏛️ Public 4-year',
    description:
      'Public bachelor\'s and graduate institutions across all states. The most common starting point for in-state cost questions.',
    filters: {
      ownership: [1],
      degreeLevels: [3, 4],
      minSize: 1000,
    },
  },
  {
    id: 'private-nonprofit',
    label: '🎓 Private nonprofit 4-year',
    description:
      'Private nonprofit bachelor\'s and graduate institutions. Where most "selective" schools live.',
    filters: {
      ownership: [2],
      degreeLevels: [3, 4],
      minSize: 1000,
    },
  },
  {
    id: 'large-flagships',
    label: '🏟️ Large public flagships',
    description:
      'Large public universities (10,000+ students) that typically serve as a state\'s flagship campus.',
    filters: {
      ownership: [1],
      degreeLevels: [3, 4],
      minSize: 10000,
    },
  },
  {
    id: 'small-private',
    label: '🏫 Small private colleges',
    description:
      'Private nonprofit colleges under 3,000 students — the classic small liberal-arts profile.',
    filters: {
      ownership: [2],
      degreeLevels: [3, 4],
      maxSize: 3000,
    },
  },
  {
    id: 'community',
    label: '📚 Community colleges',
    description:
      'Associate-predominant institutions, mostly public, that serve transfer students and working adults.',
    filters: {
      ownership: [1, 2],
      degreeLevels: [2],
      minSize: 1000,
    },
  },
  {
    id: 'all-4yr',
    label: '🌎 All 4-year colleges',
    description:
      'Every bachelor\'s/graduate-predominant institution in the country regardless of ownership type.',
    filters: {
      ownership: [1, 2, 3],
      degreeLevels: [3, 4],
      minSize: 500,
    },
  },
];

/**
 * Compare a preset's filters to the user's current filters. Returns true if
 * the current filter set matches the preset exactly.
 */
export function isPresetActive(filters: SearchFilters, preset: StarterPreset): boolean {
  // Ignore name/state — those are for narrowing, not for matching presets
  const presetKeys: (keyof SearchFilters)[] = [
    'ownership',
    'degreeLevels',
    'minSize',
    'maxSize',
  ];
  for (const k of presetKeys) {
    const a = preset.filters[k];
    const b = filters[k];
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      const aSorted = [...a].sort();
      const bSorted = [...b].sort();
      if (aSorted.some((v, i) => v !== bSorted[i])) return false;
    } else if (a !== b) {
      return false;
    }
  }
  return true;
}
