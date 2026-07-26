#!/bin/sh
cd /app

# /data volume'u nextjs container'i ile paylasiliyor
# nextjs kullanicisi (uid 1001) yazma izni olsun
chown -R 1001:65533 /data 2>/dev/null

while true; do
  echo "=== Bot calisiyor: $(date) ==="
  node index.js 2>&1

  # restart sinyali varsa beklemeden yeniden basla
  if [ -f /data/restart-signal ]; then
    echo "=== Restart sinyali alindi, yeniden basliyor... ==="
    rm -f /data/restart-signal
    continue
  fi

  echo "=== 2 saat bekleniyor... ==="
  sleep 7200
done
