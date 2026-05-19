// src/ui.js
import { Markup } from 'telegraf';

const OWNER_ID = Number(process.env.OWNER_CHAT_ID);
const ALLOWED_IDS = (process.env.ALLOWED_USERS || '')
  .split(',')
  .map(s => Number(s.trim()))
  .filter(Boolean);

export function isAllowedUser(userId) {
  if (!userId) return false;
  return userId === OWNER_ID || ALLOWED_IDS.includes(userId);
}

export function mainMenuKeyboard() {
  return Markup.keyboard([
    ['\ud83c\udf72 QUMMY', '\ud83e\udd64 FOODBOX'],
    ['\ud83d\udcdd \u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435', '\ud83d\udd27 \u0420\u0435\u043c\u043e\u043d\u0442'],
    ['\ud83d\udecd\ufe0f \u0412 \u043f\u043e\u043a\u0443\u043f\u043a\u0438', '\u21a9\ufe0f \u041e\u0442\u043c\u0435\u043d\u0430 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0439'],
    ['\ud83d\udcca \u0421\u0432\u043e\u0434\u043a\u0430 \u0434\u043d\u044f'],
  ]).resize();
}

export function backMenuKeyboard() {
  return Markup.keyboard([['\u2b05\ufe0f \u041d\u0430\u0437\u0430\u0434', '\ud83c\udfe0 \u0412 \u043c\u0435\u043d\u044e']]).resize();
}

export function inlineGrid(items, prefix, columns = 2) {
  const buttons = items.map(it => Markup.button.callback(it.label, `${prefix}:${it.value}`));
  const rows = [];
  for (let i = 0; i < buttons.length; i += columns) rows.push(buttons.slice(i, i + columns));
  rows.push([Markup.button.callback('\ud83c\udfe0 \u0412 \u043c\u0435\u043d\u044e', 'home')]);
  return Markup.inlineKeyboard(rows);
}

export function qtyKeyboard(prefix) {
  return Markup.inlineKeyboard([
    [1,2,3,4,5].map(n => Markup.button.callback(String(n), `${prefix}:${n}`)),
    [6,7,8,9,10].map(n => Markup.button.callback(String(n), `${prefix}:${n}`)),
    [Markup.button.callback('\ud83c\udfe0 \u0412 \u043c\u0435\u043d\u044e', 'home')],
  ]);
}

export function confirmKeyboard(yesData, noData = 'cancel') {
  return Markup.inlineKeyboard([[
    Markup.button.callback('\u2705 \u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c', yesData),
    Markup.button.callback('\u274c \u041e\u0442\u043c\u0435\u043d\u0430', noData),
  ]]);
}
