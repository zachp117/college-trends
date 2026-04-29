const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools';

export const FIELDS = {
  id: 'id',
  name: 'school.name',
  city: 'school.city',
  state: 'school.state',
  zip: 'school.zip',
  ownership: 'school.ownership',
  locale: 'school.locale',
  url: 'school.school_url',
  latitude: 'location.lat',
  longitude: 'location.lon',
  size: 'latest.student.size',
  admissionRate: 'latest.admissions.admission_rate.overall',
  satAvg: 'latest.admissions.sat_scores.average.overall',
  avgCost: 'latest.cost.avg_net_price.overall',
  tuitionIn: 'latest.cost.tuition.in_state',
  tuitionOut: 'latest.cost.tuition.out_of_state',
  completionRate: 'latest.completion.completion_rate_4yr_150nt',
  medianEarnings10: 'latest.earnings.10_yrs_after_entry.median',
  medianEarnings6: 'latest.earnings.6_yrs_after_entry.mean_earnings',
  medianDebt: 'latest.aid.median_debt.completers.overall',
  netPricePub_0_30k: 'latest.cost.net_price.public.by_income_level.0-30000',
  netPricePub_30k_48k: 'latest.cost.net_price.public.by_income_level.30001-48000',
  netPricePub_48k_75k: 'latest.cost.net_price.public.by_income_level.48001-75000',
  netPricePub_75k_110k: 'latest.cost.net_price.public.by_income_level.75001-110000',
  netPricePub_110k_plus: 'latest.cost.net_price.public.by_income_level.110001-plus',
  netPricePriv_0_30k: 'latest.cost.net_price.private.by_income_level.0-30000',
  netPricePriv_30k_48k: 'latest.cost.net_price.private.by_income_level.30001-48000',
  netPricePriv_48k_75k: 'latest.cost.net_price.private.by_income_level.48001-75000',
  netPricePriv_75k_110k: 'latest.cost.net_price.private.by_income_level.75001-110000',
  netPricePriv_110k_plus: 'latest.cost.net_price.private.by_income_level.110001-plus',
  medianDebtNoncompleters: 'latest.aid.median_debt.noncompleters',
  medianDebtPell: 'latest.aid.median_debt.pell_grant',
  medianDebtNoPell: 'latest.aid.median_debt.no_pell_grant',
  medianDebtLowIncome: 'latest.aid.median_debt.income.0_30000',
  medianDebtMidIncome: 'latest.aid.median_debt.income.30001_75000',
  medianDebtHighIncome: 'latest.aid.median_debt.income.greater_than_75000',
  medianDebtFemale: 'latest.aid.median_debt.female_students',
  medianDebtMale: 'latest.aid.median_debt.male_students',
  cumulativeDebtP10: 'latest.aid.cumulative_debt_P10',
  cumulativeDebtP25: 'latest.aid.cumulative_debt_P25',
  cumulativeDebtP75: 'latest.aid.cumulative_debt_P75',
  cumulativeDebtP90: 'latest.aid.cumulative_debt_P90',
  loanPrincipal: 'latest.aid.loan_principal',
  federalLoanRate: 'latest.aid.federal_loan_rate',
  pellGrantRate: 'latest.aid.pell_grant_rate',
  repay1yrComp: 'latest.repayment.1_yr_repayment.completers_rate',
  repay1yrNon: 'latest.repayment.1_yr_repayment.noncompleters_rate',
  repay3yrComp: 'latest.repayment.3_yr_repayment.completers_rate',
  repay3yrNon: 'latest.repayment.3_yr_repayment.noncompleters_rate',
  repay5yrComp: 'latest.repayment.5_yr_repayment.completers_rate',
  repay5yrNon: 'latest.repayment.5_yr_repayment.noncompleters_rate',
  repay7yrComp: 'latest.repayment.7_yr_repayment.completers_rate',
  repay7yrNon: 'latest.repayment.7_yr_repayment.noncompleters_rate',
  defaultRate3yr: 'latest.repayment.3_yr_default_rate',
  raceWhite: 'latest.student.demographics.race_ethnicity.white',
  raceBlack: 'latest.student.demographics.race_ethnicity.black',
  raceHispanic: 'latest.student.demographics.race_ethnicity.hispanic',
  raceAsian: 'latest.student.demographics.race_ethnicity.asian',
  raceAian: 'latest.student.demographics.race_ethnicity.aian',
  raceNhpi: 'latest.student.demographics.race_ethnicity.nhpi',
  raceTwoMore: 'latest.student.demographics.race_ethnicity.two_or_more',
  raceNonResident: 'latest.student.demographics.race_ethnicity.non_resident_alien',
  raceUnknown: 'latest.student.demographics.race_ethnicity.unknown',
  genderMen: 'latest.student.demographics.men',
  genderWomen: 'latest.student.demographics.women',
  ageEntry: 'latest.student.demographics.age_entry',
  share25Older: 'latest.student.share_25_older',
  over23Entry: 'latest.student.demographics.over_23_at_entry',
  medianFamilyIncome: 'latest.student.demographics.median_family_income',
  avgFamilyIncome: 'latest.student.demographics.avg_family_income',
  avgFamilyIncomeIndep: 'latest.student.demographics.avg_family_income_independents',
  firstGen: 'latest.student.share_firstgeneration',
  veteran: 'latest.student.demographics.veteran',
  partTime: 'latest.student.part_time_share',
  dependentShare: 'latest.student.demographics.dependent',
  marriedShare: 'latest.student.demographics.married',
  studentFacultyRatio: 'latest.student.demographics.student_faculty_ratio',

  completion4yrWhite: 'latest.completion.completion_rate_4yr_150_white',
  completion4yrBlack: 'latest.completion.completion_rate_4yr_150_black',
  completion4yrHispanic: 'latest.completion.completion_rate_4yr_150_hispanic',
  completion4yrAsian: 'latest.completion.completion_rate_4yr_150_asian',
  completion4yrAian: 'latest.completion.completion_rate_4yr_150_aian',
  completion4yrNhpi: 'latest.completion.completion_rate_4yr_150_nhpi',
  completion4yrTwoMore: 'latest.completion.completion_rate_4yr_150_2more',
  completion4yrNonRes: 'latest.completion.completion_rate_4yr_150_nra',

  completion6yrFemale: 'latest.completion.title_iv.female.completed_by.6yrs',
  completion6yrMale: 'latest.completion.title_iv.male.completed_by.6yrs',
  completion6yrPell: 'latest.completion.title_iv.pell_recip.completed_by.6yrs',
  completion6yrNoPell: 'latest.completion.title_iv.no_pell.completed_by.6yrs',

  earnings10MedianMale: 'latest.earnings.10_yrs_after_entry.median_earnings.male_students',
  earnings10MedianNonMale: 'latest.earnings.10_yrs_after_entry.median_earnings.non_male_students',
  earnings10MedianDep: 'latest.earnings.10_yrs_after_entry.median_earnings.dependent_students',
  earnings10MedianIndep: 'latest.earnings.10_yrs_after_entry.median_earnings.independent_students',
  earnings10MedianLowTerc: 'latest.earnings.10_yrs_after_entry.median_earnings.lowest_tercile',
  earnings10MedianMidTerc: 'latest.earnings.10_yrs_after_entry.median_earnings.middle_tercile',
  earnings10MedianHighTerc: 'latest.earnings.10_yrs_after_entry.median_earnings.highest_tercile',

  satRead25: 'latest.admissions.sat_scores.25th_percentile.critical_reading',
  satRead50: 'latest.admissions.sat_scores.50th_percentile.critical_reading',
  satRead75: 'latest.admissions.sat_scores.75th_percentile.critical_reading',
  satMath25: 'latest.admissions.sat_scores.25th_percentile.math',
  satMath50: 'latest.admissions.sat_scores.50th_percentile.math',
  satMath75: 'latest.admissions.sat_scores.75th_percentile.math',
  actCum25: 'latest.admissions.act_scores.25th_percentile.cumulative',
  actCum50: 'latest.admissions.act_scores.50th_percentile.cumulative',
  actCum75: 'latest.admissions.act_scores.75th_percentile.cumulative',
  actEng25: 'latest.admissions.act_scores.25th_percentile.english',
  actEng50: 'latest.admissions.act_scores.50th_percentile.english',
  actEng75: 'latest.admissions.act_scores.75th_percentile.english',
  actMath25: 'latest.admissions.act_scores.25th_percentile.math',
  actMath50: 'latest.admissions.act_scores.50th_percentile.math',
  actMath75: 'latest.admissions.act_scores.75th_percentile.math',
  testRequirements: 'latest.admissions.test_requirements',

  earnings10P10: 'latest.earnings.10_yrs_after_entry.working_not_enrolled.earnings_percentile.10',
  earnings10P25: 'latest.earnings.10_yrs_after_entry.working_not_enrolled.earnings_percentile.25',
  earnings10P75: 'latest.earnings.10_yrs_after_entry.working_not_enrolled.earnings_percentile.75',
  earnings10P90: 'latest.earnings.10_yrs_after_entry.working_not_enrolled.earnings_percentile.90',
  earnings6P10: 'latest.earnings.6_yrs_after_entry.working_not_enrolled.earnings_percentile.10',
  earnings6P25: 'latest.earnings.6_yrs_after_entry.working_not_enrolled.earnings_percentile.25',
  earnings6P75: 'latest.earnings.6_yrs_after_entry.working_not_enrolled.earnings_percentile.75',
  earnings6P90: 'latest.earnings.6_yrs_after_entry.working_not_enrolled.earnings_percentile.90',
  earnings6MedianTrue: 'latest.earnings.6_yrs_after_entry.median',
  threshold10_25k: 'latest.earnings.10_yrs_after_entry.percent_greater_than_25000',
  threshold10_28k: 'latest.earnings.10_yrs_after_entry.percent_greater_than_28000',
  threshold6_25k: 'latest.earnings.6_yrs_after_entry.percent_greater_than_25000',
  threshold6_28k: 'latest.earnings.6_yrs_after_entry.percent_greater_than_28000',

  retentionFt4yr: 'latest.student.retention_rate.four_year.full_time',
  retentionPt4yr: 'latest.student.retention_rate.four_year.part_time',
  retentionFtLt4yr: 'latest.student.retention_rate.lt_four_year.full_time',
  retentionPtLt4yr: 'latest.student.retention_rate.lt_four_year.part_time',
  transferRate4yrFt: 'latest.completion.transfer_rate.4yr.full_time',
  titleIvCompleted4: 'latest.completion.title_iv.completed_by.4yrs',
  titleIvCompleted6: 'latest.completion.title_iv.completed_by.6yrs',
  titleIvCompleted8: 'latest.completion.title_iv.completed_by.8yrs',
  titleIvWithdrawn4: 'latest.completion.title_iv.withdrawn_by.4yrs',
  titleIvWithdrawn6: 'latest.completion.title_iv.withdrawn_by.6yrs',
  titleIvWithdrawn8: 'latest.completion.title_iv.withdrawn_by.8yrs',
  titleIvStillEnrolled4: 'latest.completion.title_iv.still_enrolled_by.4yrs',
  titleIvStillEnrolled6: 'latest.completion.title_iv.still_enrolled_by.6yrs',
  titleIvStillEnrolled8: 'latest.completion.title_iv.still_enrolled_by.8yrs',
  titleIvTransfCompleted6: 'latest.completion.title_iv.transf_completed_4yr_by.6yrs',
  titleIvTransfCompleted2yr6: 'latest.completion.title_iv.transf_completed_2yr_by.6yrs',
  titleIvTransfWithdrawn6: 'latest.completion.title_iv.transf_withdrawn_4yr_by.6yrs',
  titleIvUnknown6: 'latest.completion.title_iv.unknown_by.6yrs',

  ftftFederalLoanRate: 'latest.aid.ftft_federal_loan_rate',
  ftftPellGrantRate: 'latest.aid.ftft_pell_grant_rate',
  monthlyPaymentEst: 'latest.aid.median_debt.completers.monthly_payments',
  medianDebtFirstGen: 'latest.aid.median_debt.first_generation_students',
  medianDebtNotFirstGen: 'latest.aid.median_debt.non_first_generation_students',
  medianDebtDependent: 'latest.aid.median_debt.dependent_students',
  medianDebtIndependent: 'latest.aid.median_debt.independent_students',
  plusDebtAll: 'latest.aid.plus_debt.all.all_inst.median',
  plusDebtAllCount: 'latest.aid.plus_debt.all.all_inst.count',
  plusDebtCompleters: 'latest.aid.plus_debt.completers.all_inst.median',
  plusDebtCompletersPayment: 'latest.aid.plus_debt.completers.all_inst.median_payment',
  plusDebtNoncompleters: 'latest.aid.plus_debt.noncompleters.all_inst.median',
  plusDebtMale: 'latest.aid.plus_debt.male.all_inst.median',
  plusDebtNotMale: 'latest.aid.plus_debt.not_male.all_inst.median',

  facultyMen: 'latest.student.demographics.faculty.men',
  facultyWomen: 'latest.student.demographics.faculty.women',
  facultyWhite: 'latest.student.demographics.faculty.race_ethnicity.white',
  facultyBlack: 'latest.student.demographics.faculty.race_ethnicity.black',
  facultyHispanic: 'latest.student.demographics.faculty.race_ethnicity.hispanic',
  facultyAsian: 'latest.student.demographics.faculty.race_ethnicity.asian',
  facultyAian: 'latest.student.demographics.faculty.race_ethnicity.aian',
  facultyNhpi: 'latest.student.demographics.faculty.race_ethnicity.nhpi',
  facultyTwoMore: 'latest.student.demographics.faculty.race_ethnicity.two_or_more',
  facultyNonResident: 'latest.student.demographics.faculty.race_ethnicity.non_resident_alien',
  facultyUnknown: 'latest.student.demographics.faculty.race_ethnicity.unknown',
} as const;

export const TEST_POLICY_LABELS: Record<number, string> = {
  1: 'Required',
  2: 'Recommended',
  3: 'Neither required nor recommended',
  4: 'Do not know',
  5: 'Considered but not required',
};

export const INCOME_BRACKETS = [
  { key: '0_30k', label: '<$30k', pubField: 'netPricePub_0_30k', privField: 'netPricePriv_0_30k' },
  { key: '30k_48k', label: '$30–48k', pubField: 'netPricePub_30k_48k', privField: 'netPricePriv_30k_48k' },
  { key: '48k_75k', label: '$48–75k', pubField: 'netPricePub_48k_75k', privField: 'netPricePriv_48k_75k' },
  { key: '75k_110k', label: '$75–110k', pubField: 'netPricePub_75k_110k', privField: 'netPricePriv_75k_110k' },
  { key: '110k_plus', label: '$110k+', pubField: 'netPricePub_110k_plus', privField: 'netPricePriv_110k_plus' },
] as const;

export type OwnershipCode = 1 | 2 | 3; // 1=public, 2=private nonprofit, 3=private for-profit

export const OWNERSHIP_LABELS: Record<number, string> = {
  1: 'Public',
  2: 'Private nonprofit',
  3: 'Private for-profit',
};

export interface School {
  id: number;
  name: string;
  city: string;
  state: string;
  zip: string;
  ownership: number;
  locale: number | null;
  url: string | null;
  latitude: number | null;
  longitude: number | null;
  size: number | null;
  admissionRate: number | null;
  satAvg: number | null;
  avgCost: number | null;
  tuitionIn: number | null;
  tuitionOut: number | null;
  completionRate: number | null;
  medianEarnings10: number | null;
  medianEarnings6: number | null;
  medianDebt: number | null;
  netPriceByIncome: Record<string, number | null>;
  medianDebtNoncompleters: number | null;
  medianDebtPell: number | null;
  medianDebtNoPell: number | null;
  medianDebtLowIncome: number | null;
  medianDebtMidIncome: number | null;
  medianDebtHighIncome: number | null;
  medianDebtFemale: number | null;
  medianDebtMale: number | null;
  cumulativeDebtP10: number | null;
  cumulativeDebtP25: number | null;
  cumulativeDebtP75: number | null;
  cumulativeDebtP90: number | null;
  loanPrincipal: number | null;
  federalLoanRate: number | null;
  pellGrantRate: number | null;
  repayment: {
    yr1Comp: number | null;
    yr1Non: number | null;
    yr3Comp: number | null;
    yr3Non: number | null;
    yr5Comp: number | null;
    yr5Non: number | null;
    yr7Comp: number | null;
    yr7Non: number | null;
  };
  defaultRate3yr: number | null;

  raceWhite: number | null;
  raceBlack: number | null;
  raceHispanic: number | null;
  raceAsian: number | null;
  raceAian: number | null;
  raceNhpi: number | null;
  raceTwoMore: number | null;
  raceNonResident: number | null;
  raceUnknown: number | null;

  genderMen: number | null;
  genderWomen: number | null;

  ageEntry: number | null;
  share25Older: number | null;
  over23Entry: number | null;

  medianFamilyIncome: number | null;
  avgFamilyIncome: number | null;
  avgFamilyIncomeIndep: number | null;

  firstGen: number | null;
  veteran: number | null;
  partTime: number | null;
  dependentShare: number | null;
  marriedShare: number | null;
  studentFacultyRatio: number | null;

  completion4yrWhite: number | null;
  completion4yrBlack: number | null;
  completion4yrHispanic: number | null;
  completion4yrAsian: number | null;
  completion4yrAian: number | null;
  completion4yrNhpi: number | null;
  completion4yrTwoMore: number | null;
  completion4yrNonRes: number | null;

  completion6yrFemale: number | null;
  completion6yrMale: number | null;
  completion6yrPell: number | null;
  completion6yrNoPell: number | null;

  earnings10MedianMale: number | null;
  earnings10MedianNonMale: number | null;
  earnings10MedianDep: number | null;
  earnings10MedianIndep: number | null;
  earnings10MedianLowTerc: number | null;
  earnings10MedianMidTerc: number | null;
  earnings10MedianHighTerc: number | null;

  satRead25: number | null;
  satRead50: number | null;
  satRead75: number | null;
  satMath25: number | null;
  satMath50: number | null;
  satMath75: number | null;
  actCum25: number | null;
  actCum50: number | null;
  actCum75: number | null;
  actEng25: number | null;
  actEng50: number | null;
  actEng75: number | null;
  actMath25: number | null;
  actMath50: number | null;
  actMath75: number | null;
  testRequirements: number | null;

  earnings10P10: number | null;
  earnings10P25: number | null;
  earnings10P75: number | null;
  earnings10P90: number | null;
  earnings6P10: number | null;
  earnings6P25: number | null;
  earnings6P75: number | null;
  earnings6P90: number | null;
  earnings6MedianTrue: number | null;
  threshold10_25k: number | null;
  threshold10_28k: number | null;
  threshold6_25k: number | null;
  threshold6_28k: number | null;

  retentionFt4yr: number | null;
  retentionPt4yr: number | null;
  retentionFtLt4yr: number | null;
  retentionPtLt4yr: number | null;
  transferRate4yrFt: number | null;
  titleIvCompleted4: number | null;
  titleIvCompleted6: number | null;
  titleIvCompleted8: number | null;
  titleIvWithdrawn4: number | null;
  titleIvWithdrawn6: number | null;
  titleIvWithdrawn8: number | null;
  titleIvStillEnrolled4: number | null;
  titleIvStillEnrolled6: number | null;
  titleIvStillEnrolled8: number | null;
  titleIvTransfCompleted6: number | null;
  titleIvTransfCompleted2yr6: number | null;
  titleIvTransfWithdrawn6: number | null;
  titleIvUnknown6: number | null;

  ftftFederalLoanRate: number | null;
  ftftPellGrantRate: number | null;
  monthlyPaymentEst: number | null;
  medianDebtFirstGen: number | null;
  medianDebtNotFirstGen: number | null;
  medianDebtDependent: number | null;
  medianDebtIndependent: number | null;
  plusDebtAll: number | null;
  plusDebtAllCount: number | null;
  plusDebtCompleters: number | null;
  plusDebtCompletersPayment: number | null;
  plusDebtNoncompleters: number | null;
  plusDebtMale: number | null;
  plusDebtNotMale: number | null;

  facultyMen: number | null;
  facultyWomen: number | null;
  facultyWhite: number | null;
  facultyBlack: number | null;
  facultyHispanic: number | null;
  facultyAsian: number | null;
  facultyAian: number | null;
  facultyNhpi: number | null;
  facultyTwoMore: number | null;
  facultyNonResident: number | null;
  facultyUnknown: number | null;
}

export type DegreeLevel = 1 | 2 | 3 | 4;

export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  1: 'Certificate',
  2: 'Associate (community college)',
  3: "Bachelor's",
  4: 'Graduate',
};

export interface SearchFilters {
  name?: string;
  state?: string;
  ownership?: OwnershipCode[];
  minSize?: number;
  maxSize?: number;
  degreeLevels?: DegreeLevel[];
}

export interface SearchResult {
  schools: School[];
  total: number;
  page: number;
  perPage: number;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_SCORECARD_API_KEY;
  if (!key || key === 'your_api_data_gov_key_here') {
    throw new Error(
      'Missing VITE_SCORECARD_API_KEY. Get a free key from api.data.gov/signup and add it to .env',
    );
  }
  return key;
}

async function fetchWithRetry(url: string, maxAttempts = 5): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      // Retry on 5xx and 429; fail fast on other 4xx
      if (res.status >= 500 || res.status === 429) {
        if (attempt === maxAttempts - 1) return res;
        // Backoff: 500ms, 1s, 2s, 4s — total ~7.5s before giving up
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt + Math.random() * 250));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === maxAttempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt + Math.random() * 250));
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

function mapRow(row: Record<string, unknown>): School {
  const g = <T,>(key: string): T | null => {
    const v = row[key];
    return v === undefined || v === null ? null : (v as T);
  };
  return {
    id: row[FIELDS.id] as number,
    name: (row[FIELDS.name] as string) ?? '',
    city: (row[FIELDS.city] as string) ?? '',
    state: (row[FIELDS.state] as string) ?? '',
    zip: (row[FIELDS.zip] as string) ?? '',
    ownership: (row[FIELDS.ownership] as number) ?? 0,
    locale: g<number>(FIELDS.locale),
    url: g<string>(FIELDS.url),
    latitude: g<number>(FIELDS.latitude),
    longitude: g<number>(FIELDS.longitude),
    size: g<number>(FIELDS.size),
    admissionRate: g<number>(FIELDS.admissionRate),
    satAvg: g<number>(FIELDS.satAvg),
    avgCost: g<number>(FIELDS.avgCost),
    tuitionIn: g<number>(FIELDS.tuitionIn),
    tuitionOut: g<number>(FIELDS.tuitionOut),
    completionRate: g<number>(FIELDS.completionRate),
    medianEarnings10: g<number>(FIELDS.medianEarnings10),
    medianEarnings6: g<number>(FIELDS.medianEarnings6),
    medianDebt: g<number>(FIELDS.medianDebt),
    netPriceByIncome: Object.fromEntries(
      INCOME_BRACKETS.map((b) => [
        b.key,
        g<number>(FIELDS[b.pubField]) ?? g<number>(FIELDS[b.privField]),
      ]),
    ),
    medianDebtNoncompleters: g<number>(FIELDS.medianDebtNoncompleters),
    medianDebtPell: g<number>(FIELDS.medianDebtPell),
    medianDebtNoPell: g<number>(FIELDS.medianDebtNoPell),
    medianDebtLowIncome: g<number>(FIELDS.medianDebtLowIncome),
    medianDebtMidIncome: g<number>(FIELDS.medianDebtMidIncome),
    medianDebtHighIncome: g<number>(FIELDS.medianDebtHighIncome),
    medianDebtFemale: g<number>(FIELDS.medianDebtFemale),
    medianDebtMale: g<number>(FIELDS.medianDebtMale),
    cumulativeDebtP10: g<number>(FIELDS.cumulativeDebtP10),
    cumulativeDebtP25: g<number>(FIELDS.cumulativeDebtP25),
    cumulativeDebtP75: g<number>(FIELDS.cumulativeDebtP75),
    cumulativeDebtP90: g<number>(FIELDS.cumulativeDebtP90),
    loanPrincipal: g<number>(FIELDS.loanPrincipal),
    federalLoanRate: g<number>(FIELDS.federalLoanRate),
    pellGrantRate: g<number>(FIELDS.pellGrantRate),
    repayment: {
      yr1Comp: g<number>(FIELDS.repay1yrComp),
      yr1Non: g<number>(FIELDS.repay1yrNon),
      yr3Comp: g<number>(FIELDS.repay3yrComp),
      yr3Non: g<number>(FIELDS.repay3yrNon),
      yr5Comp: g<number>(FIELDS.repay5yrComp),
      yr5Non: g<number>(FIELDS.repay5yrNon),
      yr7Comp: g<number>(FIELDS.repay7yrComp),
      yr7Non: g<number>(FIELDS.repay7yrNon),
    },
    defaultRate3yr: g<number>(FIELDS.defaultRate3yr),

    raceWhite: g<number>(FIELDS.raceWhite),
    raceBlack: g<number>(FIELDS.raceBlack),
    raceHispanic: g<number>(FIELDS.raceHispanic),
    raceAsian: g<number>(FIELDS.raceAsian),
    raceAian: g<number>(FIELDS.raceAian),
    raceNhpi: g<number>(FIELDS.raceNhpi),
    raceTwoMore: g<number>(FIELDS.raceTwoMore),
    raceNonResident: g<number>(FIELDS.raceNonResident),
    raceUnknown: g<number>(FIELDS.raceUnknown),

    genderMen: g<number>(FIELDS.genderMen),
    genderWomen: g<number>(FIELDS.genderWomen),

    ageEntry: g<number>(FIELDS.ageEntry),
    share25Older: g<number>(FIELDS.share25Older),
    over23Entry: g<number>(FIELDS.over23Entry),

    medianFamilyIncome: g<number>(FIELDS.medianFamilyIncome),
    avgFamilyIncome: g<number>(FIELDS.avgFamilyIncome),
    avgFamilyIncomeIndep: g<number>(FIELDS.avgFamilyIncomeIndep),

    firstGen: g<number>(FIELDS.firstGen),
    veteran: g<number>(FIELDS.veteran),
    partTime: g<number>(FIELDS.partTime),
    dependentShare: g<number>(FIELDS.dependentShare),
    marriedShare: g<number>(FIELDS.marriedShare),
    studentFacultyRatio: g<number>(FIELDS.studentFacultyRatio),

    completion4yrWhite: g<number>(FIELDS.completion4yrWhite),
    completion4yrBlack: g<number>(FIELDS.completion4yrBlack),
    completion4yrHispanic: g<number>(FIELDS.completion4yrHispanic),
    completion4yrAsian: g<number>(FIELDS.completion4yrAsian),
    completion4yrAian: g<number>(FIELDS.completion4yrAian),
    completion4yrNhpi: g<number>(FIELDS.completion4yrNhpi),
    completion4yrTwoMore: g<number>(FIELDS.completion4yrTwoMore),
    completion4yrNonRes: g<number>(FIELDS.completion4yrNonRes),

    completion6yrFemale: g<number>(FIELDS.completion6yrFemale),
    completion6yrMale: g<number>(FIELDS.completion6yrMale),
    completion6yrPell: g<number>(FIELDS.completion6yrPell),
    completion6yrNoPell: g<number>(FIELDS.completion6yrNoPell),

    earnings10MedianMale: g<number>(FIELDS.earnings10MedianMale),
    earnings10MedianNonMale: g<number>(FIELDS.earnings10MedianNonMale),
    earnings10MedianDep: g<number>(FIELDS.earnings10MedianDep),
    earnings10MedianIndep: g<number>(FIELDS.earnings10MedianIndep),
    earnings10MedianLowTerc: g<number>(FIELDS.earnings10MedianLowTerc),
    earnings10MedianMidTerc: g<number>(FIELDS.earnings10MedianMidTerc),
    earnings10MedianHighTerc: g<number>(FIELDS.earnings10MedianHighTerc),

    satRead25: g<number>(FIELDS.satRead25),
    satRead50: g<number>(FIELDS.satRead50),
    satRead75: g<number>(FIELDS.satRead75),
    satMath25: g<number>(FIELDS.satMath25),
    satMath50: g<number>(FIELDS.satMath50),
    satMath75: g<number>(FIELDS.satMath75),
    actCum25: g<number>(FIELDS.actCum25),
    actCum50: g<number>(FIELDS.actCum50),
    actCum75: g<number>(FIELDS.actCum75),
    actEng25: g<number>(FIELDS.actEng25),
    actEng50: g<number>(FIELDS.actEng50),
    actEng75: g<number>(FIELDS.actEng75),
    actMath25: g<number>(FIELDS.actMath25),
    actMath50: g<number>(FIELDS.actMath50),
    actMath75: g<number>(FIELDS.actMath75),
    testRequirements: g<number>(FIELDS.testRequirements),

    earnings10P10: g<number>(FIELDS.earnings10P10),
    earnings10P25: g<number>(FIELDS.earnings10P25),
    earnings10P75: g<number>(FIELDS.earnings10P75),
    earnings10P90: g<number>(FIELDS.earnings10P90),
    earnings6P10: g<number>(FIELDS.earnings6P10),
    earnings6P25: g<number>(FIELDS.earnings6P25),
    earnings6P75: g<number>(FIELDS.earnings6P75),
    earnings6P90: g<number>(FIELDS.earnings6P90),
    earnings6MedianTrue: g<number>(FIELDS.earnings6MedianTrue),
    threshold10_25k: g<number>(FIELDS.threshold10_25k),
    threshold10_28k: g<number>(FIELDS.threshold10_28k),
    threshold6_25k: g<number>(FIELDS.threshold6_25k),
    threshold6_28k: g<number>(FIELDS.threshold6_28k),

    retentionFt4yr: g<number>(FIELDS.retentionFt4yr),
    retentionPt4yr: g<number>(FIELDS.retentionPt4yr),
    retentionFtLt4yr: g<number>(FIELDS.retentionFtLt4yr),
    retentionPtLt4yr: g<number>(FIELDS.retentionPtLt4yr),
    transferRate4yrFt: g<number>(FIELDS.transferRate4yrFt),
    titleIvCompleted4: g<number>(FIELDS.titleIvCompleted4),
    titleIvCompleted6: g<number>(FIELDS.titleIvCompleted6),
    titleIvCompleted8: g<number>(FIELDS.titleIvCompleted8),
    titleIvWithdrawn4: g<number>(FIELDS.titleIvWithdrawn4),
    titleIvWithdrawn6: g<number>(FIELDS.titleIvWithdrawn6),
    titleIvWithdrawn8: g<number>(FIELDS.titleIvWithdrawn8),
    titleIvStillEnrolled4: g<number>(FIELDS.titleIvStillEnrolled4),
    titleIvStillEnrolled6: g<number>(FIELDS.titleIvStillEnrolled6),
    titleIvStillEnrolled8: g<number>(FIELDS.titleIvStillEnrolled8),
    titleIvTransfCompleted6: g<number>(FIELDS.titleIvTransfCompleted6),
    titleIvTransfCompleted2yr6: g<number>(FIELDS.titleIvTransfCompleted2yr6),
    titleIvTransfWithdrawn6: g<number>(FIELDS.titleIvTransfWithdrawn6),
    titleIvUnknown6: g<number>(FIELDS.titleIvUnknown6),

    ftftFederalLoanRate: g<number>(FIELDS.ftftFederalLoanRate),
    ftftPellGrantRate: g<number>(FIELDS.ftftPellGrantRate),
    monthlyPaymentEst: g<number>(FIELDS.monthlyPaymentEst),
    medianDebtFirstGen: g<number>(FIELDS.medianDebtFirstGen),
    medianDebtNotFirstGen: g<number>(FIELDS.medianDebtNotFirstGen),
    medianDebtDependent: g<number>(FIELDS.medianDebtDependent),
    medianDebtIndependent: g<number>(FIELDS.medianDebtIndependent),
    plusDebtAll: g<number>(FIELDS.plusDebtAll),
    plusDebtAllCount: g<number>(FIELDS.plusDebtAllCount),
    plusDebtCompleters: g<number>(FIELDS.plusDebtCompleters),
    plusDebtCompletersPayment: g<number>(FIELDS.plusDebtCompletersPayment),
    plusDebtNoncompleters: g<number>(FIELDS.plusDebtNoncompleters),
    plusDebtMale: g<number>(FIELDS.plusDebtMale),
    plusDebtNotMale: g<number>(FIELDS.plusDebtNotMale),

    facultyMen: g<number>(FIELDS.facultyMen),
    facultyWomen: g<number>(FIELDS.facultyWomen),
    facultyWhite: g<number>(FIELDS.facultyWhite),
    facultyBlack: g<number>(FIELDS.facultyBlack),
    facultyHispanic: g<number>(FIELDS.facultyHispanic),
    facultyAsian: g<number>(FIELDS.facultyAsian),
    facultyAian: g<number>(FIELDS.facultyAian),
    facultyNhpi: g<number>(FIELDS.facultyNhpi),
    facultyTwoMore: g<number>(FIELDS.facultyTwoMore),
    facultyNonResident: g<number>(FIELDS.facultyNonResident),
    facultyUnknown: g<number>(FIELDS.facultyUnknown),
  };
}

function applyFilterParams(params: URLSearchParams, filters: SearchFilters): void {
  if (filters.name) params.set('school.name', filters.name);
  if (filters.state) params.set('school.state', filters.state);
  if (filters.ownership && filters.ownership.length > 0) {
    params.set('school.ownership', filters.ownership.join(','));
  }
  if (filters.minSize !== undefined || filters.maxSize !== undefined) {
    const lo = filters.minSize ?? '';
    const hi = filters.maxSize ?? '';
    params.set('latest.student.size__range', `${lo}..${hi}`);
  }
  if (filters.degreeLevels && filters.degreeLevels.length > 0) {
    params.set('school.degrees_awarded.predominant', filters.degreeLevels.join(','));
  }
}

// api.data.gov caps URI length at ~8KB. With 170+ fields the URL exceeds it,
// so we split the field list into chunks and merge responses by school id.
const FIELD_CHUNK_SIZE = 70;

function chunkFields(fields: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < fields.length; i += size) chunks.push(fields.slice(i, i + size));
  return chunks;
}

async function fetchSchoolsChunked(
  filters: SearchFilters,
  page: number,
  perPage: number,
): Promise<{ rows: Record<string, unknown>[]; total: number }> {
  const allFields = Object.values(FIELDS);
  // Always include id in every chunk so we can merge by it
  const chunks = chunkFields(allFields, FIELD_CHUNK_SIZE).map((c) =>
    c.includes('id') ? c : ['id', ...c],
  );

  const responses = await Promise.all(
    chunks.map(async (fieldsChunk) => {
      const params = new URLSearchParams();
      params.set('api_key', getApiKey());
      params.set('fields', fieldsChunk.join(','));
      params.set('per_page', String(perPage));
      params.set('page', String(page));
      params.set('sort', 'latest.student.size:desc');
      applyFilterParams(params, filters);
      const res = await fetchWithRetry(`${BASE_URL}?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Scorecard API ${res.status}: ${text.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        metadata: { total: number; page: number; per_page: number };
        results: Record<string, unknown>[];
      };
      return json;
    }),
  );

  const total = responses[0].metadata.total;
  const merged = new Map<number, Record<string, unknown>>();
  for (const resp of responses) {
    for (const row of resp.results) {
      const id = row['id'] as number;
      const existing = merged.get(id) ?? { id };
      Object.assign(existing, row);
      merged.set(id, existing);
    }
  }

  return { rows: Array.from(merged.values()), total };
}

export async function searchSchools(
  filters: SearchFilters,
  page = 0,
  perPage = 50,
): Promise<SearchResult> {
  const { rows, total } = await fetchSchoolsChunked(filters, page, perPage);
  return {
    schools: rows.map(mapRow),
    total,
    page,
    perPage,
  };
}

export async function fetchSchoolById(id: number): Promise<School | null> {
  const allFields = Object.values(FIELDS);
  const chunks = chunkFields(allFields, FIELD_CHUNK_SIZE).map((c) =>
    c.includes('id') ? c : ['id', ...c],
  );

  const responses = await Promise.all(
    chunks.map(async (fieldsChunk) => {
      const params = new URLSearchParams();
      params.set('api_key', getApiKey());
      params.set('id', String(id));
      params.set('fields', fieldsChunk.join(','));
      params.set('per_page', '1');
      const res = await fetchWithRetry(`${BASE_URL}?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Scorecard API ${res.status}: ${text.slice(0, 200)}`);
      }
      const json = (await res.json()) as { results: Record<string, unknown>[] };
      return json.results[0] ?? null;
    }),
  );

  if (responses.some((r) => r === null)) return null;
  const merged: Record<string, unknown> = { id };
  for (const r of responses) {
    if (r) Object.assign(merged, r);
  }
  return mapRow(merged);
}

export const TREND_METRICS = {
  tuitionIn: { path: 'cost.tuition.in_state', label: 'In-state tuition', format: 'money' },
  tuitionOut: { path: 'cost.tuition.out_of_state', label: 'Out-of-state tuition', format: 'money' },
  avgNetPrice: { path: 'cost.avg_net_price.overall', label: 'Avg net price', format: 'money' },
  admissionRate: { path: 'admissions.admission_rate.overall', label: 'Admission rate', format: 'pct' },
  completionRate: { path: 'completion.completion_rate_4yr_150nt', label: '4-yr completion rate', format: 'pct' },
  size: { path: 'student.size', label: 'Enrollment', format: 'num' },
  medianDebt: { path: 'aid.median_debt.completers.overall', label: 'Median debt (completers)', format: 'money' },
  defaultRate: { path: 'repayment.3_yr_default_rate', label: '3-yr default rate', format: 'pct' },
  earnings10: { path: 'earnings.10_yrs_after_entry.median', label: 'Median earnings (10y after entry)', format: 'money' },
  pellRate: { path: 'aid.pell_grant_rate', label: 'Pell recipients', format: 'pct' },
  federalLoanRate: { path: 'aid.federal_loan_rate', label: 'Federal loan recipients', format: 'pct' },
} as const;

export type TrendMetricKey = keyof typeof TREND_METRICS;

export interface HistoryPoint {
  year: number;
  value: number | null;
}

export interface SchoolHistory {
  id: number;
  name: string;
  series: Record<TrendMetricKey, HistoryPoint[]>;
}

export async function fetchSchoolHistory(
  schoolIds: number[],
  years: number[],
): Promise<SchoolHistory[]> {
  if (schoolIds.length === 0) return [];
  const fields: string[] = ['id', 'school.name'];
  for (const y of years) {
    for (const m of Object.values(TREND_METRICS)) {
      fields.push(`${y}.${m.path}`);
    }
  }
  const params = new URLSearchParams();
  params.set('api_key', getApiKey());
  params.set('id', schoolIds.join(','));
  params.set('fields', fields.join(','));
  params.set('per_page', String(Math.max(schoolIds.length, 20)));

  const res = await fetchWithRetry(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scorecard API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    results: Record<string, unknown>[];
  };

  return json.results.map((row) => {
    const series = {} as Record<TrendMetricKey, HistoryPoint[]>;
    (Object.keys(TREND_METRICS) as TrendMetricKey[]).forEach((key) => {
      const path = TREND_METRICS[key].path;
      series[key] = years.map((y) => {
        const v = row[`${y}.${path}`];
        return { year: y, value: typeof v === 'number' ? v : null };
      });
    });
    return {
      id: row['id'] as number,
      name: (row['school.name'] as string) ?? '',
      series,
    };
  });
}

export const CREDENTIAL_LABELS: Record<number, string> = {
  1: 'Undergraduate cert.',
  2: "Associate's",
  3: "Bachelor's",
  4: 'Post-bac cert.',
  5: "Master's",
  6: 'Doctoral',
  7: 'First professional',
  8: 'Graduate cert.',
};

export interface Program {
  schoolId: number;
  schoolName: string;
  title: string;
  code: string;
  credentialLevel: number;
  credentialTitle: string;

  completers: number | null;
  completers2: number | null;

  earnings1yr: number | null;
  earnings4yr: number | null;
  earnings5yr: number | null;

  earnings1yrMale: number | null;
  earnings1yrNonmale: number | null;
  earnings1yrPell: number | null;
  earnings1yrNonpell: number | null;
  earnings5yrMale: number | null;
  earnings5yrNonmale: number | null;
  earnings5yrPell: number | null;
  earnings5yrNonpell: number | null;

  working1yr: number | null;
  notWorking1yr: number | null;
  workingInState1yr: number | null;
  higherCredential5yr: number | null;

  medianDebt: number | null;
  monthlyPayment: number | null;
  medianDebtPell: number | null;
  medianDebtNonpell: number | null;

  // Derived
  employmentRate1yr: number | null;
  inStateRate1yr: number | null;
  gradSchoolRate5yr: number | null;
  debtToIncome5yr: number | null;
  genderGap5yr: number | null;
  pellGap5yr: number | null;
}

interface RawEarningsSlice {
  overall_median_earnings?: number | null;
  male_median_earnings?: number | null;
  nonmale_median_earnings?: number | null;
  pell_median_earnings?: number | null;
  nonpell_median_earnings?: number | null;
  working_not_enrolled?: { overall_count?: number | null };
  not_working_not_enrolled?: { overall_count?: number | null };
  overall_count_working_in_institution_state?: number | null;
  overall_count_awarded_higher_credential?: number | null;
}

interface RawProgram {
  title?: string;
  code?: string;
  credential?: { level?: number; title?: string };
  counts?: { ipeds_awards1?: number | null; ipeds_awards2?: number | null };
  earnings?: {
    '1_yr'?: RawEarningsSlice;
    '4_yr'?: RawEarningsSlice;
    '5_yr'?: RawEarningsSlice;
  };
  debt?: {
    staff_grad_plus?: {
      all?: { all_inst?: { median?: number | null; median_payment?: number | null } };
      pell?: { all_inst?: { median?: number | null } };
      not_pell?: { all_inst?: { median?: number | null } };
    };
  };
}

function cleanProgramTitle(t: string): string {
  return t.replace(/\.\s*$/, '').trim();
}

export async function fetchSchoolPrograms(schoolIds: number[]): Promise<Program[]> {
  if (schoolIds.length === 0) return [];
  // Request the whole cip_4_digit subtree — smaller in URL than listing every leaf
  const fields = ['id', 'school.name', 'latest.programs.cip_4_digit'];
  const params = new URLSearchParams();
  params.set('api_key', getApiKey());
  params.set('id', schoolIds.join(','));
  params.set('fields', fields.join(','));
  params.set('per_page', String(Math.max(schoolIds.length, 20)));

  const res = await fetchWithRetry(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scorecard API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    results: Array<{
      id: number;
      'school.name': string;
      'latest.programs.cip_4_digit'?: RawProgram[];
    }>;
  };

  const out: Program[] = [];
  for (const row of json.results) {
    const progs = row['latest.programs.cip_4_digit'] ?? [];
    for (const p of progs) {
      const e1 = p.earnings?.['1_yr'];
      const e4 = p.earnings?.['4_yr'];
      const e5 = p.earnings?.['5_yr'];
      const debtAll = p.debt?.staff_grad_plus?.all?.all_inst;
      const debtPell = p.debt?.staff_grad_plus?.pell?.all_inst?.median ?? null;
      const debtNonpell = p.debt?.staff_grad_plus?.not_pell?.all_inst?.median ?? null;

      const working = e1?.working_not_enrolled?.overall_count ?? null;
      const notWorking = e1?.not_working_not_enrolled?.overall_count ?? null;
      const workingInState = e1?.overall_count_working_in_institution_state ?? null;
      const higherCred = e5?.overall_count_awarded_higher_credential ?? null;

      const employmentRate1yr =
        working !== null && notWorking !== null && working + notWorking > 0
          ? working / (working + notWorking)
          : null;
      const inStateRate1yr =
        working !== null && workingInState !== null && working > 0
          ? workingInState / working
          : null;
      const gradSchoolRate5yr =
        higherCred !== null && working !== null && notWorking !== null && working + notWorking > 0
          ? higherCred / (working + notWorking + higherCred)
          : null;

      const earnings5 = e5?.overall_median_earnings ?? null;
      const payment = debtAll?.median_payment ?? null;
      const debtToIncome5yr =
        payment !== null && earnings5 !== null && earnings5 > 0
          ? (payment * 12) / earnings5
          : null;

      const m5 = e5?.male_median_earnings ?? null;
      const nm5 = e5?.nonmale_median_earnings ?? null;
      const genderGap5yr = m5 !== null && nm5 !== null ? m5 - nm5 : null;
      const pe5 = e5?.pell_median_earnings ?? null;
      const npe5 = e5?.nonpell_median_earnings ?? null;
      const pellGap5yr = npe5 !== null && pe5 !== null ? npe5 - pe5 : null;

      out.push({
        schoolId: row.id,
        schoolName: row['school.name'],
        title: cleanProgramTitle(p.title ?? ''),
        code: p.code ?? '',
        credentialLevel: p.credential?.level ?? 0,
        credentialTitle: p.credential?.title ?? '',

        completers: p.counts?.ipeds_awards1 ?? null,
        completers2: p.counts?.ipeds_awards2 ?? null,

        earnings1yr: e1?.overall_median_earnings ?? null,
        earnings4yr: e4?.overall_median_earnings ?? null,
        earnings5yr: earnings5,

        earnings1yrMale: e1?.male_median_earnings ?? null,
        earnings1yrNonmale: e1?.nonmale_median_earnings ?? null,
        earnings1yrPell: e1?.pell_median_earnings ?? null,
        earnings1yrNonpell: e1?.nonpell_median_earnings ?? null,
        earnings5yrMale: m5,
        earnings5yrNonmale: nm5,
        earnings5yrPell: pe5,
        earnings5yrNonpell: npe5,

        working1yr: working,
        notWorking1yr: notWorking,
        workingInState1yr: workingInState,
        higherCredential5yr: higherCred,

        medianDebt: debtAll?.median ?? null,
        monthlyPayment: payment,
        medianDebtPell: debtPell,
        medianDebtNonpell: debtNonpell,

        employmentRate1yr,
        inStateRate1yr,
        gradSchoolRate5yr,
        debtToIncome5yr,
        genderGap5yr,
        pellGap5yr,
      });
    }
  }
  return out;
}

export interface ProgressInfo {
  loaded: number;
  total: number;
}

interface FetchAllOptions {
  onProgress?: (info: ProgressInfo) => void;
  signal?: AbortSignal;
  concurrency?: number;
  maxSchools?: number;
}

export async function searchAllSchools(
  filters: SearchFilters,
  opts: FetchAllOptions = {},
): Promise<{ schools: School[]; total: number }> {
  const { onProgress, signal, concurrency = 5, maxSchools = 25000 } = opts;
  const PER_PAGE = 100;

  const first = await searchSchools(filters, 0, PER_PAGE);
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

  const total = Math.min(first.total, maxSchools);
  const accumulated: School[] = [...first.schools];
  onProgress?.({ loaded: accumulated.length, total });

  if (accumulated.length >= total) {
    return { schools: accumulated, total: first.total };
  }

  const totalPages = Math.ceil(total / PER_PAGE);
  const remainingPages: number[] = [];
  for (let p = 1; p < totalPages; p++) remainingPages.push(p);

  let cursor = 0;
  const worker = async () => {
    while (cursor < remainingPages.length) {
      const idx = cursor++;
      const page = remainingPages[idx];
      if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
      const r = await searchSchools(filters, page, PER_PAGE);
      accumulated.push(...r.schools);
      onProgress?.({ loaded: accumulated.length, total });
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, remainingPages.length) }, worker);
  await Promise.all(workers);

  return { schools: accumulated, total: first.total };
}

export interface AggregatePoint {
  year: number;
  mean: number | null;
  n: number;
}

export interface AggregateHistory {
  years: number[];
  perYear: AggregatePoint[];
  avgFirst: number | null;
  avgLast: number | null;
  avgChange: number | null;
  medianPctChange: number | null;
  nWithChange: number;
  totalSchools: number;
  schoolsWithAnyData: number;
}

async function fetchHistoryPage(
  filters: SearchFilters,
  page: number,
  perPage: number,
  fields: string[],
): Promise<{ rows: Record<string, unknown>[]; total: number }> {
  const params = new URLSearchParams();
  params.set('api_key', getApiKey());
  params.set('fields', fields.join(','));
  params.set('per_page', String(perPage));
  params.set('page', String(page));
  applyFilterParams(params, filters);

  const res = await fetchWithRetry(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scorecard API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    metadata: { total: number };
    results: Record<string, unknown>[];
  };
  return { rows: json.results, total: json.metadata.total };
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export async function fetchHistoryAggregate(
  filters: SearchFilters,
  metric: TrendMetricKey,
  years: number[],
  opts: FetchAllOptions = {},
): Promise<AggregateHistory> {
  const { onProgress, signal, concurrency = 5, maxSchools = 25000 } = opts;
  const PER_PAGE = 100;
  const path = TREND_METRICS[metric].path;
  const fields = ['id', ...years.map((y) => `${y}.${path}`)];

  const first = await fetchHistoryPage(filters, 0, PER_PAGE, fields);
  if (signal?.aborted) throw new DOMException('aborted', 'AbortError');

  const total = Math.min(first.total, maxSchools);
  const allRows: Record<string, unknown>[] = [...first.rows];
  onProgress?.({ loaded: allRows.length, total });

  if (allRows.length < total) {
    const totalPages = Math.ceil(total / PER_PAGE);
    const remainingPages: number[] = [];
    for (let p = 1; p < totalPages; p++) remainingPages.push(p);

    let cursor = 0;
    const failedPages: number[] = [];
    const worker = async () => {
      while (cursor < remainingPages.length) {
        const idx = cursor++;
        const page = remainingPages[idx];
        if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
        try {
          const r = await fetchHistoryPage(filters, page, PER_PAGE, fields);
          allRows.push(...r.rows);
        } catch (e) {
          if (signal?.aborted) throw e;
          // Tolerate single-page failures rather than collapsing the whole aggregate.
          // Partial data is more useful than an error screen.
          failedPages.push(page);
          console.warn(`History aggregate: page ${page} failed after retries`, e);
        }
        onProgress?.({ loaded: allRows.length, total });
      }
    };
    const workers = Array.from(
      { length: Math.min(concurrency, remainingPages.length) },
      worker,
    );
    await Promise.all(workers);
    if (failedPages.length > 0) {
      console.warn(
        `History aggregate completed with ${failedPages.length}/${totalPages} pages missing.`,
      );
    }
  }

  // Build per-year means
  const perYear: AggregatePoint[] = years.map((y) => {
    const key = `${y}.${path}`;
    const vals: number[] = [];
    for (const row of allRows) {
      const v = row[key];
      if (typeof v === 'number') vals.push(v);
    }
    const mean = vals.length === 0 ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
    return { year: y, mean, n: vals.length };
  });

  // Per-school endpoint deltas (earliest and latest non-null within the range)
  const perSchoolChanges: number[] = [];
  const perSchoolPctChanges: number[] = [];
  let schoolsWithAnyData = 0;
  for (const row of allRows) {
    let firstVal: number | null = null;
    let lastVal: number | null = null;
    for (const y of years) {
      const v = row[`${y}.${path}`];
      if (typeof v === 'number') {
        if (firstVal === null) firstVal = v;
        lastVal = v;
      }
    }
    if (firstVal !== null) schoolsWithAnyData++;
    if (firstVal !== null && lastVal !== null && firstVal !== lastVal) {
      perSchoolChanges.push(lastVal - firstVal);
      if (firstVal !== 0) perSchoolPctChanges.push((lastVal - firstVal) / firstVal);
    }
  }

  const avgFirst = perYear[0]?.mean ?? null;
  const avgLast = perYear[perYear.length - 1]?.mean ?? null;
  const avgChange =
    perSchoolChanges.length === 0
      ? null
      : perSchoolChanges.reduce((a, b) => a + b, 0) / perSchoolChanges.length;
  const medianPctChange = median(perSchoolPctChanges);

  return {
    years,
    perYear,
    avgFirst,
    avgLast,
    avgChange,
    medianPctChange,
    nWithChange: perSchoolChanges.length,
    totalSchools: first.total,
    schoolsWithAnyData,
  };
}
