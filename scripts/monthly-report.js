// scripts/monthly-report.js
import 'dotenv/config';
import { DateTime } from 'luxon';
import { getReportPeriod, getPreviousPeriod } from './period.js';
import { fetchAll, isAlreadySent, logRunToSheet, ensureLogsSheet } from './sheets-client.js';
import { buildReport, renderHTML } from './report-builder.js';
import { sendLong } from './tg-client.js';

const argPeriodFromCLI = () => {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) return null;
  const TZ = process.env.REPORT_TZ;
  const start = DateTime.fromISO(a, { zone: TZ }).startOf('day');
  const end   = DateTime.fromISO(b, { zone: TZ }).endOf('day');
  if (!start.isValid || !end.isValid) {
    console.error('Wrong date format. Use YYYY-MM-DD');
    process.exit(1);
  }
  return {
    start, end,
    label: `${start.toFormat('dd.MM.yyyy')} \u2013 ${end.toFormat('dd.MM.yyyy')}`,
    key:   `manual_${a}_${b}`,
  };
};

async function main() {
  const period = argPeriodFromCLI() || getReportPeriod();
  console.log(`[${new Date().toISOString()}] Report for ${period.label}`);
  await ensureLogsSheet();

  if (!period.key.startsWith('manual_') && await isAlreadySent(period.key)) {
    console.log('Already sent. Exit.');
    return;
  }

  const prevPeriod = getPreviousPeriod(period);
  const data = await fetchAll();
  console.log(`Loaded: ${data.ops.length} ops, ${data.goods.length} goods, ${data.repair.length} repairs`);

  const prevData = buildReport(data, prevPeriod, prevPeriod, null);
  const report   = buildReport(data, period, prevPeriod, prevData);
  const html     = renderHTML(report);
  console.log(`Size: ${html.length} chars`);

  try {
    const messageId = await sendLong(html);
    await logRunToSheet(period.key, 'sent', messageId);
    console.log(`OK message_id=${messageId}`);
  } catch (e) {
    console.error('FAIL:', e.message);
    await logRunToSheet(period.key, `error: ${e.message}`, null);
    process.exit(1);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
