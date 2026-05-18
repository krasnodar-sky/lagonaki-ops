// scripts/sheets-client.js
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const ID = process.env.GOOGLE_SHEETS_ID;

export async function fetchAll() {
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: ID,
    ranges: [
      '\u041e\u0431\u044a\u0435\u043a\u0442\u044b!A2:F',
      '\u0422\u043e\u0432\u0430\u0440\u044b!A2:J',
      '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438!A2:J',
      '\u041f\u0440\u0438\u0445\u043e\u0434\u044b!A2:I',
      '\u0420\u0435\u043c\u043e\u043d\u0442!A2:J',
      '\u041f\u043e\u043a\u0443\u043f\u043a\u0438!A2:J',
      '\u0414\u0430\u0448\u0431\u043e\u0440\u0434!A2:B',
    ],
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const [objects, goods, ops, income, repair, supply, dashboard] = data.valueRanges.map(r => r.values || []);
  return { objects, goods, ops, income, repair, supply, dashboard };
}

export async function ensureLogsSheet() {
  try {
    await sheets.spreadsheets.values.get({ spreadsheetId: ID, range: 'Logs!A1:D1' });
  } catch (e) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: ID,
      requestBody: { requests: [{ addSheet: { properties: { title: 'Logs' } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: ID,
      range: 'Logs!A1:D1',
      valueInputOption: 'RAW',
      requestBody: { values: [['timestamp', 'period_key', 'status', 'message_id']] },
    });
  }
}

export async function logRunToSheet(periodKey, status, messageId) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: ID,
    range: 'Logs!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[new Date().toISOString(), periodKey, status, messageId || '']] },
  });
}

export async function isAlreadySent(periodKey) {
  try {
    const { data } = await sheets.spreadsheets.values.get({ spreadsheetId: ID, range: 'Logs!A:D' });
    return (data.values || []).some(row => row[1] === periodKey && row[2] === 'sent');
  } catch { return false; }
}
