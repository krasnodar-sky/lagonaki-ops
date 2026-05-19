// src/sheets.js - all Google Sheets operations
import { google } from 'googleapis';
import { DateTime } from 'luxon';
import { invalidateCache, getGoods } from './catalog.js';

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const ID = process.env.GOOGLE_SHEETS_ID;
const TZ = 'Europe/Moscow';

const SHEET_OPS = '\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u0438';
const SHEET_GOODS = '\u0422\u043e\u0432\u0430\u0440\u044b';
const SHEET_REPAIR = '\u0420\u0435\u043c\u043e\u043d\u0442';
const SHEET_SHOP = '\u041f\u043e\u043a\u0443\u043f\u043a\u0438';

const now = () => DateTime.now().setZone(TZ).toFormat('dd.MM.yyyy HH:mm');
const today = () => DateTime.now().setZone(TZ).toFormat('dd.MM.yyyy');

export async function recordSale({ sku, qty, who }) {
  const goods = await getGoods();
  const item = goods.get(sku);
  if (!item) throw new Error(`SKU ${sku} not found`);
  const total = qty * item.price;
  await sheets.spreadsheets.values.append({
    spreadsheetId: ID,
    range: `${SHEET_OPS}!A:J`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[now(), 'sale', 'FT', sku, item.name, qty, item.price, total, who, '']] },
  });
  await updateStock(sku, item.stock - qty);
  invalidateCache();
  return { item, qty, total };
}

export async function recordWriteoff({ sku, qty, who }) {
  const goods = await getGoods();
  const item = goods.get(sku);
  if (!item) throw new Error(`SKU ${sku} not found`);
  const total = qty * item.price;
  await sheets.spreadsheets.values.append({
    spreadsheetId: ID,
    range: `${SHEET_OPS}!A:J`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[now(), 'writeoff', 'FT', sku, item.name, qty, item.price, total, who, '']] },
  });
  await updateStock(sku, item.stock - qty);
  invalidateCache();
  return { item, qty, total };
}

export async function getLastOperation() {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: ID, range: `${SHEET_OPS}!A2:J`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = data.values || [];
  if (rows.length === 0) return null;
  const last = rows[rows.length - 1];
  return {
    rowIndex: rows.length + 1,
    dateTime: last[0], type: last[1], sku: last[3], name: last[4],
    qty: Number(last[5]) || 0, price: Number(last[6]) || 0,
    total: Number(last[7]) || 0, who: last[8] || '',
  };
}

export async function cancelLastOperation() {
  const last = await getLastOperation();
  if (!last) throw new Error('No operations to cancel');
  if (last.qty < 0) throw new Error('Last is already a cancel');
  await sheets.spreadsheets.values.append({
    spreadsheetId: ID,
    range: `${SHEET_OPS}!A:J`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[now(), last.type, 'FT', last.sku, last.name, -last.qty, last.price, -last.total, last.who, `cancel ${last.dateTime}`]] },
  });
  const goods = await getGoods();
  const item = goods.get(last.sku);
  if (item) await updateStock(last.sku, item.stock + last.qty);
  invalidateCache();
  return last;
}

export async function createRepair({ object, description, urgency, who }) {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: ID, range: `${SHEET_REPAIR}!A2:A`,
  });
  const count = (data.values || []).length;
  const id = `R${String(count + 1).padStart(3, '0')}`;
  await sheets.spreadsheets.values.append({
    spreadsheetId: ID,
    range: `${SHEET_REPAIR}!A:J`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[id, today(), object, '', description, urgency, '', '\u043d\u043e\u0432\u0430\u044f', '', who]] },
  });
  return { id, object, description, urgency };
}

export async function addShopping({ name, object, priority, who }) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: ID,
    range: `${SHEET_SHOP}!A:J`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[today(), '', name, '', object, priority, who, '\u043d\u0443\u0436\u043d\u043e', '', '']] },
  });
  return { name, object, priority };
}

export async function getDaySummary() {
  const { data } = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: ID,
    ranges: [`${SHEET_OPS}!A2:J`, `${SHEET_REPAIR}!A2:J`, `${SHEET_GOODS}!A2:J`],
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const [ops, repair, goods] = data.valueRanges.map(r => r.values || []);
  const td = today();
  const todayOps = ops.filter(r => String(r[0] || '').startsWith(td));
  const sales = todayOps.filter(r => r[1] === 'sale');
  const writeoffs = todayOps.filter(r => r[1] === 'writeoff');
  const revQ = sales.filter(r => String(r[3] || '').startsWith('Q')).reduce((s, r) => s + (Number(r[7]) || 0), 0);
  const revF = sales.filter(r => String(r[3] || '').startsWith('F')).reduce((s, r) => s + (Number(r[7]) || 0), 0);
  const writeoffTotal = writeoffs.reduce((s, r) => s + (Number(r[7]) || 0), 0);
  const adminSalary = revQ * 0.10 + revF * 0.20;
  const openRepairs = repair.filter(r => r[7] && !['\u0433\u043e\u0442\u043e\u0432\u043e','done','closed','\u0437\u0430\u043a\u0440\u044b\u0442\u043e','\u0440\u0435\u0448\u0435\u043d\u043e'].includes(String(r[7]).toLowerCase()));
  const empty = goods.filter(g => Number(g[7]) === 0);
  const low = goods.filter(g => Number(g[7]) > 0 && Number(g[7]) <= Number(g[8] || 0));
  return { date: td, revQ, revF, revTotal: revQ + revF, salesCount: sales.length, writeoffTotal, adminSalary, openRepairs: openRepairs.length, empty, low };
}

async function updateStock(sku, newStock) {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: ID, range: `${SHEET_GOODS}!A:A`,
  });
  const idx = (data.values || []).findIndex(r => r[0] === sku);
  if (idx < 0) throw new Error(`SKU ${sku} not found in Goods`);
  const row = idx + 1;
  const status = newStock === 0 ? '\ud83d\udd34 \u043d\u0435\u0442' : newStock <= 3 ? '\ud83d\udfe1 \u043c\u0430\u043b\u043e' : '\ud83d\udfe2 \u043e\u043a';
  await sheets.spreadsheets.values.update({
    spreadsheetId: ID,
    range: `${SHEET_GOODS}!H${row}:J${row}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newStock, '', status]] },
  });
}
