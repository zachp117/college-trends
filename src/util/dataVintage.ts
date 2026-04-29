// Most-recent year reported in the College Scorecard API per field family.
// Sourced from https://collegescorecard.ed.gov/data/documentation/ and verified
// against live API responses. Update as new releases land.

export interface FieldVintage {
  family: string;
  year: string;
  note?: string;
}

export const FIELD_VINTAGES: FieldVintage[] = [
  { family: 'Tuition / cost / net price', year: '2023–24' },
  { family: 'Admissions (admit rate, SAT/ACT)', year: '2022–23' },
  { family: 'Completion / retention', year: '2022–23' },
  { family: 'Student demographics & enrollment', year: '2022–23' },
  { family: 'Repayment / 3-yr default rate', year: '2021–22' },
  { family: 'Median debt at graduation', year: '2019–20' },
  {
    family: 'Earnings (10-yr after entry)',
    year: '2020 tax year',
    note: 'reflects students who entered college around 2010',
  },
];
