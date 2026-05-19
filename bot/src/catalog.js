// src/catalog.js - categories and goods cache
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const ID = process.env.GOOGLE_SHEETS_ID;

export const SUBCATS = {
  QUMMY: {
    breakfast: { label: '\ud83c\udf73 \u0417\u0430\u0432\u0442\u0440\u0430\u043a/\u0414\u0435\u0441\u0435\u0440\u0442', skus: ['Q01','Q02','Q03','Q04','Q15','Q16','Q17'] },
    soup:      { label: '\ud83c\udf72 \u0421\u0443\u043f\u044b',           skus: ['Q05','Q06','Q07'] },
    hot:       { label: '\ud83c\udf5d \u0413\u043e\u0440\u044f\u0447\u0435\u0435',         skus: ['Q08','Q09','Q10','Q11','Q12','Q13','Q14','Q18','Q19'] },
  },
  FOODBOX: {
    water:  { label: '\ud83d\udca7 \u0412\u043e\u0434\u0430',     skus: ['F01','F02','F03'] },
    drink:  { label: '\ud83e\udd64 \u041d\u0430\u043f\u0438\u0442\u043a\u0438',  skus: ['F04','F05','F06','F07','F08','F09','F13'] },
    snack:  { label: '\ud83c\udf6b \u0421\u043d\u0435\u043a\u0438',    skus: ['F10','F11','F12'] },
  },
};

export const OBJECTS = [
  { id: 'C1', label: '\u0414\u043e\u043c\u0438\u043a 1' },
  { id: 'C2', label: '\u0414\u043e\u043c\u0438\u043a 2' },
  { id: 'C3', label: '\u0414\u043e\u043c\u0438\u043a 3' },
  { id: 'C4', label: '\u0414\u043e\u043c\u0438\u043a 4' },
  { id: 'B1', label: '\u042f\u043f\u043e\u043d\u0441\u043a\u0430\u044f \u0431\u0430\u043d\u044f' },
  { id: 'FT', label: '\u0424\u0443\u0434\u0442\u0440\u0430\u043a' },
  { id: 'AREA', label: '\u041e\u0431\u0449\u0430\u044f \u0437\u043e\u043d\u0430' },
];

export const URGENCY = [
  { val: 1, label: '1 \u2014 \u043a\u043e\u0441\u043c\u0435\u0442\u0438\u043a\u0430' },
  { val: 2, label: '2 \u2014 \u043c\u0435\u043b\u043a\u0438\u0439 \u0440\u0435\u043c\u043e\u043d\u0442' },
  { val: 3, label: '3 \u2014 \u0441\u0440\u0435\u0434\u043d\u0438\u0439' },
  { val: 4, label: '4 \u2014 \u0441\u0435\u0440\u044c\u0451\u0437\u043d\u044b\u0439' },
  { val: 5, label: '5 \u2014 \u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u044c!' },
];

export const PRIORITY = [
  { id: 'urgent', label: '\ud83d\udd34 \u0421\u0440\u043e\u0447\u043d\u043e' },
  { id: 'normal', label: '\u26aa \u041e\u0431\u044b\u0447\u043d\u044b\u0439' },
];

let goodsCache = null;
let goodsCacheAt = 0;
const CACHE_TTL = 60 * 1000;

export async function getGoods() {
  if (goodsCache && Date.now() - goodsCacheAt < CACHE_TTL) return goodsCache;
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: ID,
    range: '\u0422\u043e\u0432\u0430\u0440\u044b!A2:J',
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = data.values || [];
  goodsCache = new Map();
  for (const r of rows) {
    const sku = r[0]; if (!sku) continue;
    goodsCache.set(sku, {
      sku, name: r[1] || '', category: r[2] || '', subcat: r[3] || '',
      price: Number(r[4]) || 0, cost: Number(r[5]) || 0, margin: Number(r[6]) || 0,
      stock: Number(r[7]) || 0, minStock: Number(r[8]) || 0, status: r[9] || '',
    });
  }
  goodsCacheAt = Date.now();
  return goodsCache;
}

export function invalidateCache() { goodsCache = null; }

export async function getItem(sku) {
  const g = await getGoods();
  return g.get(sku);
}

export function getSubcatSkus(cat, subcat) {
  return SUBCATS[cat]?.[subcat]?.skus || [];
}
