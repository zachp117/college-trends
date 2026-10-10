// Most-recent data year per field family in the College Scorecard API.
//
// The years are measured, not typed in: scripts/check-data-updates.ts runs daily
// (GitHub Actions), finds which yearly Scorecard data file each family's `latest`
// values come from, and writes src/data/dataVintages.json. The same run records
// what changed in src/data/dataUpdates.json, shown on /changelog.
import vintagesJson from '../data/dataVintages.json';

export interface DataFamily {
  key: string;
  label: string;
  /** Scorecard field paths without the `latest.` prefix. The first one is used to find the data year. */
  fields: string[];
}

export const DATA_FAMILIES: DataFamily[] = [
  {
    key: 'cost',
    label: 'Tuition / cost / net price',
    fields: ['cost.avg_net_price.overall', 'cost.tuition.in_state', 'cost.tuition.out_of_state'],
  },
  {
    key: 'admissions',
    label: 'Admissions (admit rate, SAT/ACT)',
    fields: [
      'admissions.admission_rate.overall',
      'admissions.sat_scores.average.overall',
      'admissions.act_scores.50th_percentile.cumulative',
    ],
  },
  {
    key: 'completion',
    label: 'Completion / retention',
    fields: [
      'completion.completion_rate_4yr_150nt',
      'student.retention_rate.four_year.full_time',
    ],
  },
  {
    key: 'enrollment',
    label: 'Student demographics & enrollment',
    fields: [
      'student.size',
      'student.demographics.race_ethnicity.white',
      'student.demographics.women',
      'student.share_firstgeneration',
    ],
  },
  {
    key: 'aid',
    label: 'Financial aid (Pell grants, federal loans)',
    fields: ['aid.pell_grant_rate', 'aid.federal_loan_rate'],
  },
  {
    key: 'repayment',
    label: 'Repayment / 3-yr default rate',
    fields: ['repayment.3_yr_default_rate'],
  },
  {
    key: 'debt',
    label: 'Median debt at graduation',
    fields: ['aid.median_debt.completers.overall'],
  },
  {
    key: 'earnings',
    label: 'Earnings after entry',
    fields: ['earnings.10_yrs_after_entry.median', 'earnings.6_yrs_after_entry.median'],
  },
];

/** Scorecard year keys name the academic year they start: 2024 → "2024–25". */
export function yearLabel(year: number): string {
  return `${year}–${String((year + 1) % 100).padStart(2, '0')}`;
}

export interface FieldVintage {
  family: string;
  year: string;
  note?: string;
}

const years = (vintagesJson as { years: Record<string, number> }).years;

export const FIELD_VINTAGES: FieldVintage[] = DATA_FAMILIES.map((f) => {
  const y = years[f.key];
  return {
    family: f.label,
    year: y ? yearLabel(y) : 'n/a',
    note:
      f.key === 'earnings' && y
        ? `10-year earnings follow students who started college around ${y - 10}`
        : undefined,
  };
});
