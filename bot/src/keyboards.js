// src/keyboards.js
import { Markup } from 'telegraf';
import { SUBCATS, OBJECTS, URGENCY, PRIORITY } from './catalog.js';

export function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('\ud83c\udf72 \u041f\u0440\u043e\u0434\u0430\u0436\u0430 QUMMY', 'cat:QUMMY'), Markup.button.callback('\ud83e\udd64 \u041f\u0440\u043e\u0434\u0430\u0436\u0430 FOODBOX', 'cat:FOODBOX')],
    [Markup.button.callback('\ud83d\udcdd \u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435', 'wo:menu')],
    [Markup.button.callback('\ud83d\udd27 \u0420\u0435\u043c\u043e\u043d\u0442', 'rep:menu'), Markup.button.callback('\ud83d\udecd \u0412 \u043f\u043e\u043a\u0443\u043f\u043a\u0438', 'sh:menu')],
    [Markup.button.callback('\u21a9\ufe0f \u041e\u0442\u043c\u0435\u043d\u0430 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0439', 'undo:menu')],
    [Markup.button.callback('\ud83d\udcca \u0421\u0432\u043e\u0434\u043a\u0430 \u0434\u043d\u044f', 'day')],
  ]);
}

export function subcatKeyboard(cat, prefix = 'sub') {
  const subs = SUBCATS[cat];
  const rows = Object.entries(subs).map(([key, sc]) => [
    Markup.button.callback(sc.label, `${prefix}:${cat}:${key}`),
  ]);
  rows.push([Markup.button.callback('\u2b05\ufe0f \u041d\u0430\u0437\u0430\u0434', 'menu')]);
  return Markup.inlineKeyboard(rows);
}

export function itemsKeyboard(cat, subcat, items, prefix = 'item') {
  const rows = items.map(it => [
    Markup.button.callback(`${it.name} \u2014 ${it.price}\u20bd`, `${prefix}:${it.sku}`),
  ]);
  rows.push([Markup.button.callback('\u2b05\ufe0f \u041d\u0430\u0437\u0430\u0434', `cat:${cat}`)]);
  return Markup.inlineKeyboard(rows);
}

export function qtyKeyboard(prefix = 'qty') {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('1', `${prefix}:1`),
      Markup.button.callback('2', `${prefix}:2`),
      Markup.button.callback('3', `${prefix}:3`),
    ],
    [
      Markup.button.callback('5', `${prefix}:5`),
      Markup.button.callback('10', `${prefix}:10`),
      Markup.button.callback('\u270f\ufe0f \u0414\u0440\u0443\u0433\u043e\u0435', `${prefix}:custom`),
    ],
    [Markup.button.callback('\u2b05\ufe0f \u041d\u0430\u0437\u0430\u0434', 'menu')],
  ]);
}

export function confirmKeyboard(action) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('\u2705 \u0417\u0430\u043f\u0438\u0441\u0430\u0442\u044c', `ok:${action}`)],
    [Markup.button.callback('\u274c \u041e\u0442\u043c\u0435\u043d\u0430', 'menu')],
  ]);
}

export function objectsKeyboard(prefix = 'obj') {
  const rows = OBJECTS.map(o => [Markup.button.callback(o.label, `${prefix}:${o.id}`)]);
  rows.push([Markup.button.callback('\u2b05\ufe0f \u041d\u0430\u0437\u0430\u0434', 'menu')]);
  return Markup.inlineKeyboard(rows);
}

export function urgencyKeyboard() {
  const rows = URGENCY.map(u => [Markup.button.callback(u.label, `urg:${u.val}`)]);
  rows.push([Markup.button.callback('\u2b05\ufe0f \u041d\u0430\u0437\u0430\u0434', 'menu')]);
  return Markup.inlineKeyboard(rows);
}

export function priorityKeyboard() {
  return Markup.inlineKeyboard([
    ...PRIORITY.map(p => [Markup.button.callback(p.label, `prio:${p.id}`)]),
    [Markup.button.callback('\u2b05\ufe0f \u041d\u0430\u0437\u0430\u0434', 'menu')],
  ]);
}

export function backToMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('\ud83c\udfe0 \u0412 \u043c\u0435\u043d\u044e', 'menu')],
  ]);
}
