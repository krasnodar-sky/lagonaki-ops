// src/flow-other.js - repair, shopping, undo, summary flows
import { OBJECTS, URGENCY } from './catalog.js';
import { objectsKeyboard, urgencyKeyboard, priorityKeyboard, backToMenu } from './keyboards.js';
import { getLastOperation, cancelLastOperation, createRepair, addShopping, getDaySummary } from './sheets.js';

const who = (ctx) => ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'unknown';

export function registerOtherFlows(bot, OWNER) {
  bot.action('rep:menu', async (ctx) => {
    ctx.session.data = { op: 'repair' };
    await ctx.answerCbQuery();
    await ctx.editMessageText('\ud83d\udd27 \u0417\u0430\u044f\u0432\u043a\u0430 \u043d\u0430 \u0440\u0435\u043c\u043e\u043d\u0442. \u041a\u0430\u043a\u043e\u0439 \u043e\u0431\u044a\u0435\u043a\u0442?', objectsKeyboard('repobj'));
  });

  bot.action(/^repobj:(\w+)$/, async (ctx) => {
    const obj = OBJECTS.find(o => o.id === ctx.match[1]);
    if (!obj) return ctx.answerCbQuery('\u041e\u0431\u044a\u0435\u043a\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d', { show_alert: true });
    ctx.session.data.object = obj.label;
    ctx.session.step = 'repair_desc';
    await ctx.answerCbQuery();
    await ctx.editMessageText(`\u041e\u0431\u044a\u0435\u043a\u0442: <b>${obj.label}</b>\n\n\u041e\u043f\u0438\u0448\u0438 \u043f\u043e\u043b\u043e\u043c\u043a\u0443 (\u0442\u0435\u043a\u0441\u0442\u043e\u043c):`, { parse_mode: 'HTML' });
  });

  bot.action(/^urg:([1-5])$/, async (ctx) => {
    const urgency = Number(ctx.match[1]);
    const { object, description } = ctx.session.data;
    await ctx.answerCbQuery();
    try {
      const { id } = await createRepair({ object, description, urgency, who: who(ctx) });
      const urgLabel = URGENCY.find(u => u.val === urgency)?.label || urgency;
      await ctx.reply(
        `\ud83d\udd27 \u0417\u0430\u044f\u0432\u043a\u0430 <b>${id}</b> \u0441\u043e\u0437\u0434\u0430\u043d\u0430\n\u041e\u0431\u044a\u0435\u043a\u0442: ${object}\n\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435: ${description}\n\u0421\u0440\u043e\u0447\u043d\u043e\u0441\u0442\u044c: ${urgLabel}`,
        { parse_mode: 'HTML', ...backToMenu() }
      );
      if (urgency >= 4 && ctx.from.id !== OWNER) {
        await bot.telegram.sendMessage(OWNER,
          `\ud83d\udea8 \u0421\u0420\u041e\u0427\u041d\u0410\u042f \u0437\u0430\u044f\u0432\u043a\u0430 ${id}\n${object}\n${description}\n\u0421\u0440\u043e\u0447\u043d\u043e\u0441\u0442\u044c: ${urgLabel}\n\u0410\u0432\u0442\u043e\u0440: ${who(ctx)}`
        ).catch(() => {});
      }
    } catch (e) {
      await ctx.reply(`\u274c \u041e\u0448\u0438\u0431\u043a\u0430: ${e.message}`, backToMenu());
    }
    ctx.session = { step: null, data: {} };
  });

  bot.action('sh:menu', async (ctx) => {
    ctx.session.data = { op: 'shopping' };
    ctx.session.step = 'shopping_name';
    await ctx.answerCbQuery();
    await ctx.editMessageText('\ud83d\udecd \u0427\u0442\u043e \u043d\u0443\u0436\u043d\u043e \u043a\u0443\u043f\u0438\u0442\u044c?\n\u041d\u0430\u043f\u0438\u0448\u0438 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435:');
  });

  bot.action(/^shobj:(\w+)$/, async (ctx) => {
    const obj = OBJECTS.find(o => o.id === ctx.match[1]);
    if (!obj) return ctx.answerCbQuery('\u041e\u0431\u044a\u0435\u043a\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d', { show_alert: true });
    ctx.session.data.object = obj.label;
    await ctx.answerCbQuery();
    await ctx.editMessageText(`\u041e\u0431\u044a\u0435\u043a\u0442: ${obj.label}\n\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442?`, priorityKeyboard());
  });

  bot.action(/^prio:(urgent|normal)$/, async (ctx) => {
    const priority = ctx.match[1] === 'urgent' ? '\u0441\u0440\u043e\u0447\u043d\u043e' : '\u043e\u0431\u044b\u0447\u043d\u044b\u0439';
    const { name, object } = ctx.session.data;
    await ctx.answerCbQuery();
    try {
      await addShopping({ name, object, priority, who: who(ctx) });
      await ctx.editMessageText(
        `\ud83d\udecd \u0414\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043e:\n<b>${name}</b>\n\u041e\u0431\u044a\u0435\u043a\u0442: ${object}\n\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442: ${priority}`,
        { parse_mode: 'HTML', ...backToMenu() }
      );
    } catch (e) {
      await ctx.reply(`\u274c \u041e\u0448\u0438\u0431\u043a\u0430: ${e.message}`, backToMenu());
    }
    ctx.session = { step: null, data: {} };
  });

  bot.action('undo:menu', async (ctx) => {
    await ctx.answerCbQuery();
    const last = await getLastOperation();
    if (!last) return ctx.editMessageText('\u041d\u0435\u0442 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0439.', backToMenu());
    const verb = last.type === 'sale' ? '\u041f\u0440\u043e\u0434\u0430\u0436\u0430' : '\u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435';
    await ctx.editMessageText(
      `\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f:\n<b>${verb}</b>: ${last.name} \u00d7 ${last.qty} = ${last.total}\u20bd\n<i>${last.dateTime}</i>\n\n\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c?`,
      {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [
          [{ text: '\u2705 \u0414\u0430', callback_data: 'undo:confirm' }],
          [{ text: '\u274c \u041d\u0435\u0442', callback_data: 'menu' }],
        ]}
      }
    );
  });

  bot.action('undo:confirm', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const c = await cancelLastOperation();
      await ctx.editMessageText(`\u21a9\ufe0f \u041e\u0442\u043c\u0435\u043d\u0435\u043d\u043e: ${c.name} \u00d7 ${c.qty}`, backToMenu());
    } catch (e) {
      await ctx.reply(`\u274c ${e.message}`, backToMenu());
    }
  });

  bot.action('day', async (ctx) => {
    await ctx.answerCbQuery();
    const s = await getDaySummary();
    const fmt = (n) => Number(n).toLocaleString('ru-RU') + '\u20bd';
    let text = `<b>\ud83d\udcca \u0421\u0432\u043e\u0434\u043a\u0430 \u043d\u0430 ${s.date}</b>\n\n`;
    text += `<b>\u0412\u044b\u0440\u0443\u0447\u043a\u0430</b>\nQUMMY: ${fmt(s.revQ)}\nFOODBOX: ${fmt(s.revF)}\n\u0418\u0442\u043e\u0433\u043e: <b>${fmt(s.revTotal)}</b>\n\u041f\u0440\u043e\u0434\u0430\u0436: ${s.salesCount}\n\n`;
    text += `<b>\u0417\u041f \u0430\u0434\u043c\u0438\u043d\u0430:</b> ${fmt(s.adminSalary)}\n<b>\u0421\u043f\u0438\u0441\u0430\u043d\u043e:</b> ${fmt(s.writeoffTotal)}\n<b>\u0420\u0435\u043c\u043e\u043d\u0442:</b> ${s.openRepairs}\n\n<b>\u041e\u0441\u0442\u0430\u0442\u043a\u0438:</b>\n`;
    if (s.empty.length) text += `\u274c \u0417\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u043e\u0441\u044c: ${s.empty.slice(0,8).map(x=>x[1]).join(', ')}\n`;
    if (s.low.length) text += `\u26a0\ufe0f \u041c\u0430\u043b\u043e: ${s.low.slice(0,8).map(x=>x[1]).join(', ')}\n`;
    if (!s.empty.length && !s.low.length) text += `\u2705 \u0412\u0441\u0451 \u0432 \u043d\u043e\u0440\u043c\u0435`;
    await ctx.editMessageText(text, { parse_mode: 'HTML', ...backToMenu() });
  });

  bot.on('text', async (ctx, next) => {
    if (ctx.session.step === 'repair_desc') {
      ctx.session.data.description = ctx.message.text.trim();
      ctx.session.step = null;
      return ctx.reply('\u0421\u0440\u043e\u0447\u043d\u043e\u0441\u0442\u044c?', urgencyKeyboard());
    }
    if (ctx.session.step === 'shopping_name') {
      ctx.session.data.name = ctx.message.text.trim();
      ctx.session.step = null;
      return ctx.reply('\u0414\u043b\u044f \u043a\u0430\u043a\u043e\u0433\u043e \u043e\u0431\u044a\u0435\u043a\u0442\u0430?', objectsKeyboard('shobj'));
    }
    return next();
  });
}
