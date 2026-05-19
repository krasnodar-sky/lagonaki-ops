#!/bin/bash
# Lagonaki Bot v2 - installation on VPS
# Run as root on the VPS
set -e

echo '=== Installing Lagonaki Bot v2 ==='

BASE=/root/lagonaki-bot
REPO=https://raw.githubusercontent.com/krasnodar-sky/lagonaki-ops/main/bot

# 1. Stop v1 if running
if [ -d /root/foodtruck-bot ]; then
  echo '-- Stopping v1 (Apps Script webhook will be removed by v2 on startup) --'
fi

# 2. Create directory structure
mkdir -p $BASE/src
cd $BASE

# 3. Download files from GitHub
echo '-- Downloading files --'
curl -sO $REPO/package.json
curl -sO $REPO/index.js
curl -sO $REPO/lagonaki-bot.service
curl -s $REPO/.env.example -o .env.example
mkdir -p src
cd src
curl -sO $REPO/src/catalog.js
curl -sO $REPO/src/keyboards.js
curl -sO $REPO/src/sheets.js
curl -sO $REPO/src/flow-sale.js
curl -sO $REPO/src/flow-other.js
cd ..

# 4. Copy service-account.json from existing setup
if [ -f /root/lagonaki/service-account.json ]; then
  cp /root/lagonaki/service-account.json $BASE/service-account.json
  chmod 600 $BASE/service-account.json
  echo '-- service-account.json copied --'
else
  echo '!! WARNING: /root/lagonaki/service-account.json not found'
fi

# 5. Install dependencies
echo '-- Installing npm dependencies --'
npm install --silent 2>&1 | tail -3

# 6. Create .env if not exists
if [ ! -f $BASE/.env ]; then
  if [ -f /root/lagonaki/.env ]; then
    # Reuse existing token
    grep -E '^(TELEGRAM_BOT_TOKEN|OWNER_CHAT_ID|GOOGLE_SHEETS_ID)' /root/lagonaki/.env > $BASE/.env
    echo 'ALLOWED_CHAT_IDS=' >> $BASE/.env
    echo 'GOOGLE_APPLICATION_CREDENTIALS=/root/lagonaki-bot/service-account.json' >> $BASE/.env
    echo 'NODE_ENV=production' >> $BASE/.env
    chmod 600 $BASE/.env
    echo '-- .env created from /root/lagonaki/.env --'
  else
    echo '!! WARNING: please create .env manually from .env.example'
  fi
fi

# 7. Install systemd unit
cp $BASE/lagonaki-bot.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now lagonaki-bot.service

echo ''
echo '=== Installation complete ==='
echo ''
echo 'Status:'
systemctl status lagonaki-bot.service --no-pager -n 10 || true
echo ''
echo 'Logs (live):  journalctl -u lagonaki-bot.service -f'
echo 'Restart:      systemctl restart lagonaki-bot.service'
echo 'Stop:         systemctl stop lagonaki-bot.service'
