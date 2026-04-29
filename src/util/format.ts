const moneyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const numFmt = new Intl.NumberFormat('en-US');

export const fmtMoney = (v: number | null | undefined): string =>
  v === null || v === undefined ? '—' : moneyFmt.format(v);

export const fmtNum = (v: number | null | undefined): string =>
  v === null || v === undefined ? '—' : numFmt.format(v);

export const fmtPct = (v: number | null | undefined): string => {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(1)}%`;
};
