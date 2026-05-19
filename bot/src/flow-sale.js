// src/flow-sale.js - sale and writeoff flows
import { getItem, getSubcatSkus, SUBCATS } from './catalog.js';
import { subcatKeyboard, itemsKeyboard, qtyKeyboard, confirmKeyboard, backToMenu } from './keyboards.js';
import { recordSale, recordWriteoff } from './sheets.js';

const who = (ctx) => ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'unknown';

async function showItems(ctx, cat, subcat, prefix) {
  const skus = getSubcatSkus(cat, subcat);
  const items = [];
  for (const sku of skus) items.push(await getItem(sku));
  const label = SUBCATS[cat][subcat].label;
  await ctx.editMessageText(`${label} \u2014 \u0432\u044b\u0431\u0435\u0440\u0438:`, itemsKeyboard(cat, subcat, items, prefix));
}

async function showConfirm(ctx) {
  const { sku, qty, op } = ctx.session.data;
  const item = await getItem(sku);
  if (!item) return ctx.reply('\u041e\u0448\u0438\u0431\u043a\u0430: \u0442\u043e\u0432\u0430\u0440 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
  const total = qty * item.price;
  let warn = '';
  if (qty > item.stock) warn = `\n\n\u26a0\ufe0f \u041e\u0441\u0442\u0430\u0442\u043e\u043a ${item.stock}, \u0437\u0430\u043f\u0438\u0441\u044b\u0432\u0430\u0435\u0448\u044c ${qty}.`;
  const head = op === 'writeoff' ? '\ud83d\udcdd \u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435' : '\u2705 \u041f\u0440\u043e\u0434\u0430\u0436\u0430';
  const text = `${head}\n\n<b>${item.name}</b>\n${qty} \u00d7 ${item.price}\u20bd = <b>${total}\u20bd</b>${warn}`;
  return ctx.reply(text, { parse_mode: 'HTML', ...confirmKeyboard(op) });
}

export function registerSaleFlow(bot, OWNER) {
  bot.action(/^cat:(QUMMY|FOODBOX)$/, async (ctx) => {
    const cat = ctx.match[1];
    ctx.session.data = { ...ctx.session.data, op: 'sale', cat };
    await ctx.answerCbQuery();
    await ctx.editMessageText(`\u041f\u0440\u043e\u0434\u0430\u0436\u0430 ${cat}. \u0412\u044b\u0431\u0435\u0440\u0438 \u0440\u0430\u0437\u0434\u0435\u043b:`, subcatKeyboard(cat, 'sub'));
  });

  bot.action(/^sub:(QUMMY|FOODBOX):(\w+)$/, async (ctx) => {
    const cat = ctx.match[1], subcat = ctx.match[2];
    ctx.session.data.subcat = subcat;
    await ctx.answerCbQuery();
    await showItems(ctx, cat, subcat, 'item');
  });

  bot.action(/^item:([QF]\d+)$/, async (ctx) => {
    const sku = ctx.match[1];
    const item = await getItem(sku);
    if (!item) return ctx.answerCbQuery('\u0422\u043e\u0432\u0430\u0440 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d', { show_alert: true });
    ctx.session.data.sku = sku;
    await ctx.answerCbQuery();
    const op = ctx.session.data.op || 'sale';
    await ctx.editMessageText(
      `${op === 'sale' ? '\u041f\u0440\u043e\u0434\u0430\u0436\u0430' : '\u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435'}: <b>${item.name}</b>\n\u0426\u0435\u043d\u0430: ${item.price}\u20bd\n\u041e\u0441\u0442\u0430\u0442\u043e\u043a: ${item.stock}\n\n\u0421\u043a\u043e\u043b\u044c\u043a\u043e?`,
      { parse_mode: 'HTML', ...qtyKeyboard('qty') }
    );
  });

  bot.action(/^qty:(\d+)$/, async (ctx) => {
    ctx.session.data.qty = Number(ctx.match[1]);
    await ctx.answerCbQuery();
    return showConfirm(ctx);
  });

  bot.action('qty:custom', async (ctx) => {
    ctx.session.step = 'qty_input';
    await ctx.answerCbQuery();
    await ctx.editMessageText('\u0412\u0432\u0435\u0434\u0438 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0447\u0438\u0441\u043b\u043e\u043c (\u043d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: 7):');
  });

  bot.action('wo:menu', async (ctx) => {
    ctx.session.data = { op: 'writeoff' };
    await ctx.answerCbQuery();
    await ctx.editMessageText('\ud83d\udcdd \u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435 QUMMY. \u0412\u044b\u0431\u0435\u0440\u0438 \u0440\u0430\u0437\u0434\u0435\u043b:', subcatKeyboard('QUMMY', 'wosub'));
    await ctx.reply('\u0418\u043b\u0438 FOODBOX:', subcatKeyboard('FOODBOX', 'wosub'));
  });

  bot.action(/^wosub:(QUMMY|FOODBOX):(\w+)$/, async (ctx) => {
    const cat = ctx.match[1], subcat = ctx.match[2];
    ctx.session.data = { op: 'writeoff', cat, subcat };
    await ctx.answerCbQuery();
    await showItems(ctx, cat, subcat, 'item');
  });

  bot.action(/^ok:(sale|writeoff)$/, async (ctx) => {
    const op = ctx.match[1];
    const { sku, qty } = ctx.session.data;
    await ctx.answerCbQuery();
    try {
      const fn = op === 'sale' ? recordSale : recordWriteoff;
      const { item, total } = await fn({ sku, qty, who: who(ctx) });
      const verb = op === 'sale' ? '\u041f\u0440\u043e\u0434\u0430\u043d\u043e' : '\u0421\u043f\u0438\u0441\u0430\u043d\u043e';
      await ctx.editMessageText(
        `\u2705 ${verb}: ${item.name} \u00d7 ${qty} = ${total}\u20bd\n\u041d\u043e\u0432\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a: ${item.stock - qty}`,
        backToMenu()
      );
    } catch (e) {
      await ctx.reply(`\u274c \u041e\u0448\u0438\u0431\u043a\u0430: ${e.message}`, backToMenu());
    }
    ctx.session = { step: null, data: {} };
  });

  bot.on('text', async (ctx, next) => {
    if (ctx.session.step === 'qty_input') {
      const n = parseInt(ctx.message.text, 10);
      if (isNaN(n) || n <= 0 || n > 999) return ctx.reply('\u041d\u0443\u0436\u043d\u043e \u0447\u0438\u0441\u043b\u043e \u043e\u0442 1 \u0434\u043e 999. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437:');
      ctx.session.data.qty = n;
      ctx.session.step = null;
      return showConfirm(ctx);
    }
    return next();
  });
}

export { showConfirm, who };
