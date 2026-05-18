// scripts/tg-client.js
import TelegramBot from 'node-telegram-bot-api';
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const CHAT = Number(process.env.OWNER_CHAT_ID);
const LIMIT = 4000;

export async function sendLong(text) {
  const chunks = chunkByLines(text, LIMIT);
  let lastId;
  for (const ch of chunks) {
    const m = await bot.sendMessage(CHAT, ch, {
      parse_mode: 'HTML', disable_web_page_preview: true,
    });
    lastId = m.message_id;
  }
  return lastId;
}

function chunkByLines(text, max) {
  const lines = text.split('\n');
  const out = []; let cur = '';
  for (const ln of lines) {
    if ((cur + ln + '\n').length > max) {
      if (cur.trim()) out.push(cur);
      cur = '';
    }
    cur += ln + '\n';
  }
  if (cur.trim()) out.push(cur);
  return out;
}
