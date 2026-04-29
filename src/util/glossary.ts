// Plain-English definitions for jargon that appears throughout the app.
// Keep each entry to one or two sentences.

export const GLOSSARY: Record<string, string> = {
  // ----- General statistical terms -----
  median:
    'The middle value — half of the data is above it, half below. Less affected by extreme outliers than the average.',
  iqr:
    'Interquartile range: the gap between the 25th and 75th percentile. The wider it is, the more variation there is in outcomes.',
  percentile:
    'Where a value sits relative to others. P75 means it ranks higher than 75% of schools.',
  'percentile-rank':
    'How this school compares to others in the current filter. P75 means it ranks higher than 75% of them on this metric.',

  // ----- Cohort definitions -----
  'title-iv':
    'Students who received federal financial aid (a Pell grant or federal student loan). Many federal stats track only this group.',
  'title-iv-cohort':
    'The class of students who started here and received federal financial aid. Federal completion and outcome stats track this specific group.',
  ftft:
    'First-Time Full-Time students — those entering college for the first time and enrolled full-time. Most retention and completion stats are based on this group.',

  // ----- Completion / retention -----
  'completion-4yr-150':
    'Share of full-time students who finished a 4-year degree within 6 years (which is 150% of the standard 4-year time).',
  'completion-6yr':
    'Share of the entering class who finished a degree within 6 years at the same school.',
  'first-year-retention':
    'Share of first-year students who came back for year two. A baseline measure of student satisfaction.',
  'transfer-out':
    'Share of students who left to enroll at a different school (some go on to finish there).',
  'withdrawal-rate':
    'Share of students who left without finishing a degree and without transferring elsewhere.',
  'still-enrolled':
    "Share of students who are still working on a degree at the original school after a given number of years (haven't finished yet, but haven't left either).",

  // ----- Cost & aid -----
  'avg-net-price':
    "Average sticker price minus typical grants and scholarships — the amount most students actually pay out-of-pocket plus loans.",
  'net-price-by-income':
    "What students from each family-income bracket actually pay after their typical aid package. Often very different from the published 'sticker' price.",
  pell:
    "Federal need-based grant for low-income undergraduates. Doesn't have to be repaid.",
  'pell-rate':
    'Share of undergrads receiving a Pell grant — a rough proxy for how many low-income students attend.',
  'federal-loan-rate':
    'Share of students who took out at least one federal student loan.',
  'parent-plus':
    "Federal loan taken by parents to pay for their kid's education. Counted separately from student debt — and the parents are on the hook even if the student doesn't graduate.",
  'plus-debt':
    "Median Parent PLUS loan balance. PLUS is a federal loan parents take out for their kids' college — separate from student loans.",
  'student-debt':
    "Median federal student-loan balance carried by students who graduated. Doesn't include Parent PLUS or private loans.",

  // ----- Earnings / outcomes -----
  'earnings-10yr':
    "Median earnings of students 10 years after they started college, among those working and not enrolled in further schooling.",
  'earnings-6yr':
    "Median earnings of students 6 years after they started college, among those working and not enrolled in further schooling.",
  'earnings-distribution':
    "The 10th, 25th, 75th, and 90th percentiles of grad earnings — shows the spread, not just the typical.",
  'threshold-25k':
    "Share of grads earning more than $25k/year — roughly the threshold for 'earning more than a typical high-school graduate'.",
  'debt-to-income':
    "Annual loan payments divided by annual income. Roughly: what share of a typical grad's paycheck goes to loan payments.",
  'earnings-debt-ratio':
    "Median earnings divided by median debt. Higher = grads can pay off their debt more easily.",

  // ----- Default / repayment -----
  'default-rate':
    'Share of borrowers who defaulted (90+ days delinquent that resulted in default) on their federal loans within 3 years of entering repayment.',
  'repayment-rate':
    "Share of borrowers whose loan balance is *decreasing* — i.e., they're making progress, not just barely covering interest.",

  // ----- Demographics -----
  'first-generation':
    "Student whose parents didn't complete a bachelor's degree.",
  '25-and-older':
    "Share of students who are 25 or older — a rough measure of 'non-traditional' students (returning adults, transfers, parents).",
  'student-faculty-ratio':
    'Number of students per faculty member. Lower means smaller classes on average — though the ratio includes part-time faculty and grad students.',
  'predominant-degree':
    "The most common credential the school awards — Certificate, Associate's, Bachelor's, or Graduate.",

  // ----- Selectivity -----
  'admit-rate':
    "Share of applicants who get accepted. Lower = more selective.",
  'sat-percentile':
    "The middle 50% of admitted students' SAT scores. The 25th-75th percentile range gives a sense of the typical incoming class.",
  'test-optional':
    "School will consider SAT/ACT scores if submitted but doesn't require them. Reported scores are usually higher than reality because students with lower scores tend not to submit.",

  // ----- Programs / majors -----
  'cip-code':
    "Classification of Instructional Programs — the federal code system for academic majors. CIP-4 is a 4-digit code identifying a major (e.g., Computer Science = 1107).",
  'program-earnings':
    "Median earnings of students who completed this specific program, measured one or five years later. Only includes students who received federal aid.",
  completers:
    "Students who finished their degree program (graduated).",
  noncompleters:
    "Students who started a program but didn't finish — either left or transferred.",
};
