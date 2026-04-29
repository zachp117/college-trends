import type { School, SearchFilters } from '../api/scorecard';

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Identity / context columns always included regardless of tab
const IDENTITY_COLUMNS = [
  'id',
  'name',
  'city',
  'state',
  'zip',
  'ownership',
  'size',
  'url',
] as const;

// Columns each tab actually uses in its visualizations & tables
const TAB_COLUMNS: Record<string, string[]> = {
  overview: [
    'admissionRate',
    'avgCost',
    'completionRate',
    'medianEarnings10',
    'medianDebt',
    'netPriceByIncome.0_30k',
    'netPriceByIncome.30k_48k',
    'netPriceByIncome.48k_75k',
    'netPriceByIncome.75k_110k',
    'netPriceByIncome.110k_plus',
  ],
  map: [
    'latitude',
    'longitude',
    'admissionRate',
    'avgCost',
    'tuitionIn',
    'tuitionOut',
    'medianEarnings10',
    'completionRate',
    'medianDebt',
    'defaultRate3yr',
  ],
  selectivity: [
    'admissionRate',
    'satAvg',
    'satRead25',
    'satRead50',
    'satRead75',
    'satMath25',
    'satMath50',
    'satMath75',
    'actCum25',
    'actCum50',
    'actCum75',
    'actEng25',
    'actEng50',
    'actEng75',
    'actMath25',
    'actMath50',
    'actMath75',
    'testRequirements',
  ],
  earnings: [
    'medianEarnings10',
    'earnings10P10',
    'earnings10P25',
    'earnings10P75',
    'earnings10P90',
    'threshold10_25k',
    'threshold10_28k',
    'earnings6MedianTrue',
    'earnings6P10',
    'earnings6P25',
    'earnings6P75',
    'earnings6P90',
    'threshold6_25k',
    'threshold6_28k',
  ],
  debt: [
    'medianDebt',
    'medianDebtNoncompleters',
    'medianDebtPell',
    'medianDebtNoPell',
    'medianDebtLowIncome',
    'medianDebtMidIncome',
    'medianDebtHighIncome',
    'medianDebtFemale',
    'medianDebtMale',
    'cumulativeDebtP10',
    'cumulativeDebtP25',
    'cumulativeDebtP75',
    'cumulativeDebtP90',
    'loanPrincipal',
    'federalLoanRate',
    'pellGrantRate',
    'defaultRate3yr',
    'repayment.yr1Comp',
    'repayment.yr1Non',
    'repayment.yr3Comp',
    'repayment.yr3Non',
    'repayment.yr5Comp',
    'repayment.yr5Non',
    'repayment.yr7Comp',
    'repayment.yr7Non',
  ],
  loanaid: [
    'ftftFederalLoanRate',
    'ftftPellGrantRate',
    'federalLoanRate',
    'pellGrantRate',
    'loanPrincipal',
    'medianDebt',
    'medianDebtFirstGen',
    'medianDebtNotFirstGen',
    'medianDebtDependent',
    'medianDebtIndependent',
    'medianDebtLowIncome',
    'medianDebtMidIncome',
    'medianDebtHighIncome',
    'monthlyPaymentEst',
    'plusDebtAll',
    'plusDebtAllCount',
    'plusDebtCompleters',
    'plusDebtCompletersPayment',
    'plusDebtNoncompleters',
    'plusDebtMale',
    'plusDebtNotMale',
  ],
  retention: [
    'completionRate',
    'retentionFt4yr',
    'retentionPt4yr',
    'retentionFtLt4yr',
    'retentionPtLt4yr',
    'transferRate4yrFt',
    'titleIvCompleted4',
    'titleIvCompleted6',
    'titleIvCompleted8',
    'titleIvWithdrawn4',
    'titleIvWithdrawn6',
    'titleIvWithdrawn8',
    'titleIvStillEnrolled4',
    'titleIvStillEnrolled6',
    'titleIvStillEnrolled8',
    'titleIvTransfCompleted6',
    'titleIvTransfCompleted2yr6',
    'titleIvTransfWithdrawn6',
    'titleIvUnknown6',
  ],
  // Trends and Majors fetch their own data not present in `schools` —
  // fall back to a sensible identity + headline set
  trends: ['admissionRate', 'avgCost', 'completionRate', 'medianEarnings10', 'medianDebt'],
  majors: ['admissionRate', 'avgCost', 'completionRate', 'medianEarnings10', 'medianDebt'],
  demographics: [
    'raceWhite',
    'raceBlack',
    'raceHispanic',
    'raceAsian',
    'raceAian',
    'raceNhpi',
    'raceTwoMore',
    'raceNonResident',
    'raceUnknown',
    'genderMen',
    'genderWomen',
    'ageEntry',
    'share25Older',
    'over23Entry',
    'medianFamilyIncome',
    'avgFamilyIncome',
    'avgFamilyIncomeIndep',
    'firstGen',
    'veteran',
    'partTime',
    'dependentShare',
    'marriedShare',
    'studentFacultyRatio',
    'pellGrantRate',
  ],
  faculty: [
    'studentFacultyRatio',
    'facultyMen',
    'facultyWomen',
    'facultyWhite',
    'facultyBlack',
    'facultyHispanic',
    'facultyAsian',
    'facultyAian',
    'facultyNhpi',
    'facultyTwoMore',
    'facultyNonResident',
    'facultyUnknown',
    // student counterparts so users can compare side-by-side in the CSV
    'raceWhite',
    'raceBlack',
    'raceHispanic',
    'raceAsian',
    'raceAian',
    'raceNhpi',
    'raceTwoMore',
    'raceNonResident',
    'raceUnknown',
    'genderMen',
    'genderWomen',
  ],
  outcomes: [
    'completionRate',
    'completion4yrWhite',
    'completion4yrBlack',
    'completion4yrHispanic',
    'completion4yrAsian',
    'completion4yrAian',
    'completion4yrNhpi',
    'completion4yrTwoMore',
    'completion4yrNonRes',
    'completion6yrFemale',
    'completion6yrMale',
    'completion6yrPell',
    'completion6yrNoPell',
    'medianEarnings10',
    'earnings10MedianMale',
    'earnings10MedianNonMale',
    'earnings10MedianDep',
    'earnings10MedianIndep',
    'earnings10MedianLowTerc',
    'earnings10MedianMidTerc',
    'earnings10MedianHighTerc',
  ],
};

function flattenSchool(s: School): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(s)) {
    if (key === 'netPriceByIncome' && value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, number | null>)) {
        out[`netPriceByIncome.${k}`] = v;
      }
    } else if (key === 'repayment' && value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, number | null>)) {
        out[`repayment.${k}`] = v;
      }
    } else if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number'
    ) {
      out[key] = value;
    }
  }
  return out;
}

export function buildSchoolsCsv(schools: School[], tab?: string): string {
  if (schools.length === 0) return '';

  const tabCols = tab && TAB_COLUMNS[tab] ? TAB_COLUMNS[tab] : null;
  const columns = tabCols
    ? [...IDENTITY_COLUMNS, ...tabCols]
    : null;

  const rows: Record<string, string | number | null>[] = [];
  for (const s of schools) {
    rows.push(flattenSchool(s));
  }

  let finalColumns: string[];
  if (columns) {
    finalColumns = columns;
  } else {
    // No tab specified — fall back to all keys, alphabetical after identity
    const allKeys = new Set<string>();
    for (const r of rows) Object.keys(r).forEach((k) => allKeys.add(k));
    const rest = Array.from(allKeys)
      .filter((k) => !IDENTITY_COLUMNS.includes(k as (typeof IDENTITY_COLUMNS)[number]))
      .sort();
    finalColumns = [
      ...IDENTITY_COLUMNS.filter((k) => allKeys.has(k)),
      ...rest,
    ];
  }

  const header = finalColumns.map(csvEscape).join(',');
  const body = rows
    .map((row) => finalColumns.map((c) => csvEscape(row[c])).join(','))
    .join('\n');
  return `${header}\n${body}`;
}

export function buildExportFilename(filters: SearchFilters, tab?: string): string {
  const parts: string[] = ['college-scorecard'];
  if (filters.state) parts.push(filters.state.toLowerCase());
  if (filters.ownership && filters.ownership.length > 0) {
    const ownLabel = filters.ownership
      .map((o) => (o === 1 ? 'pub' : o === 2 ? 'priv-np' : 'priv-fp'))
      .join('-');
    parts.push(ownLabel);
  }
  if (filters.degreeLevels && filters.degreeLevels.length > 0) {
    const deg = filters.degreeLevels
      .map((d) => (d === 1 ? 'cert' : d === 2 ? 'assoc' : d === 3 ? 'bach' : 'grad'))
      .join('-');
    parts.push(deg);
  }
  if (tab) parts.push(tab);
  const date = new Date().toISOString().slice(0, 10);
  parts.push(date);
  return parts.join('_') + '.csv';
}

export function getColumnCount(tab?: string): number {
  if (tab && TAB_COLUMNS[tab]) {
    return IDENTITY_COLUMNS.length + TAB_COLUMNS[tab].length;
  }
  return 0; // 0 = all (signal to caller to show "all" or compute differently)
}

export function downloadSchoolsCsv(
  schools: School[],
  filters: SearchFilters,
  tab?: string,
): void {
  const csv = buildSchoolsCsv(schools, tab);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildExportFilename(filters, tab);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
