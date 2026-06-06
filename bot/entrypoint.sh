#!/bin/sh
cd /app
while true; do
  echo "=== Bot calisiyor: $(date) ==="
  node index.js 2>&1
  echo "=== 2 saat bekleniyor... ==="
  sleep 7200
done
