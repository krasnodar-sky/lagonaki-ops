#!/bin/bash
# Lagonaki Glamp - monthly report installer
# Usage: bash install.sh
# Requires: .env and service-account.json in /root/lagonaki/
set -e
echo '=== Installing Lagonaki Report ==='
cd /root/lagonaki
npm install --silent 2>&1 | tail -3
cp lagonaki-report.service /etc/systemd/system/ 2>/dev/null || true
cp lagonaki-report.timer /etc/systemd/system/ 2>/dev/null || true
systemctl daemon-reload
systemctl enable --now lagonaki-report.timer
echo '=== Done. Test: node scripts/monthly-report.js ==='
systemctl list-timers lagonaki-report.timer --no-pager
