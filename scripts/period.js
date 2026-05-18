// scripts/period.js
import { DateTime } from 'luxon';
const TZ = process.env.REPORT_TZ || 'Europe/Moscow';

export function getReportPeriod(now = DateTime.now().setZone(TZ)) {
  const end = now.startOf('day').plus({ days: 1 }).minus({ seconds: 1 });
  const start = end.minus({ months: 1 }).plus({ days: 1 }).startOf('day');
  return {
    start, end,
    label: `${start.toFormat('dd.MM.yyyy')} \u2013 ${end.toFormat('dd.MM.yyyy')}`,
    key: `${start.toFormat('yyyy-MM-dd')}_${end.toFormat('yyyy-MM-dd')}`,
  };
}

export function getPreviousPeriod(period) {
  const end = period.start.minus({ seconds: 1 });
  const start = end.minus({ months: 1 }).plus({ days: 1 }).startOf('day');
  return { start, end, label: `${start.toFormat('dd.MM.yyyy')} \u2013 ${end.toFormat('dd.MM.yyyy')}` };
}
