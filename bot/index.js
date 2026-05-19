// index.js - Lagonaki Bot v2 entry point
import 'dotenv/config';
import { Telegraf, session } from 'telegraf';
import { mainMenu } from './src/keyboards.js';
import { registerSaleFlow } from './src/flow-sale.js';
import { registerOtherFlows } from './src/flow-other.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const OWNER = Number(process.env.OWNER_CHAT_ID);
const ALLOWED = (process.env.ALLOWED_CHAT_IDS || '')
  .split(',').map(s => Number(s.trim())).filter(Boolean);
const isAllowed = (id) => ALLOWED.length === 0 || ALLOWED.includes(id) || id === OWNER;

bot.use(session({ defaultSession: () => ({ step: null, data: {} }) }));

bot.use(async (ctx, next) => {
  const id = ctx.from?.id;
  if (!isAllowed(id)) return ctx.reply('\u26d4 \u0414\u043e\u0441\u0442\u0443\u043f \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d. \u041e\u0431\u0440\u0430\u0442\u0438\u0441\u044c \u043a \u0432\u043b\u0430\u0434\u0435\u043b\u044c\u0446\u0443.');
  return next();
});

bot.start((ctx) => {
  ctx.session = { step: null, data: {} };
  return ctx.reply(`\u041f\u0440\u0438\u0432\u0435\u0442, ${ctx.from.first_name}!\n\n\u042f \u2014 \u0431\u043e\u0442 \u00ab\u041b\u0430\u0433\u043e\u043d\u0430\u043a\u0438 \u0413\u043b\u044d\u043c\u043f\u00bb.\n\u0427\u0442\u043e \u0434\u0435\u043b\u0430\u0435\u043c?`, mainMenu());
});

bot.command('menu', (ctx) => {
  ctx.session = { step: null, data: {} };
  return ctx.reply('\u0413\u043b\u0430\u0432\u043d\u043e\u0435 \u043c\u0435\u043d\u044e:', mainMenu());
});

bot.command('id', (ctx) => ctx.reply(`\u0422\u0432\u043e\u0439 chat_id: ${ctx.chat.id}`));

bot.action('menu', async (ctx) => {
  ctx.session = { step: null, data: {} };
  await ctx.answerCbQuery();
  await ctx.editMessageText('\u0413\u043b\u0430\u0432\u043d\u043e\u0435 \u043c\u0435\u043d\u044e:', mainMenu()).catch(() => ctx.reply('\u0413\u043b\u0430\u0432\u043d\u043e\u0435 \u043c\u0435\u043d\u044e:', mainMenu()));
});

registerSaleFlow(bot, OWNER);
registerOtherFlows(bot, OWNER);

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply(`\u274c \u041e\u0448\u0438\u0431\u043a\u0430: ${err.message}\n\n\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 /menu`).catch(() => {});
});

console.log(`[${new Date().toISOString()}] \u0417\u0430\u043f\u0443\u0441\u043a \u041b\u0430\u0433\u043e\u043d\u0430\u043a\u0438 \u0411\u043e\u0442 v2...`);

await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});

bot.launch().then(() => {
  console.log(`[${new Date().toISOString()}] \u2705 \u0411\u043e\u0442 v2 \u0437\u0430\u043f\u0443\u0449\u0435\u043d (long polling)`);
  if (OWNER) {
    bot.telegram.sendMessage(OWNER,
      `\ud83d\ude80 \u0411\u043e\u0442 v2 \u0437\u0430\u043f\u0443\u0449\u0435\u043d \u0432 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} \u041c\u0421\u041a`
    ).catch(() => {});
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
