# ═══════════════════════════════════════════════
#  GünYayla Haber Portalı — Yönetim Komutları
#  Kullanım: make <komut>
# ═══════════════════════════════════════════════

.PHONY: baslat durdur guncelle yeniden-baslat log durum yedek db-push db-studio db-shell db-status temizle

## Siteyi başlatır
baslat:
	docker compose up -d --build
	@echo "✅  Site başlatıldı → http://localhost"
	@echo "🔧  Ghost Admin    → http://localhost/ghost"
	@echo "✏️   Editör Panel   → http://localhost/editor"

## Durdur (veriler korunur)
durdur:
	docker compose down

## Yeniden başlat
yeniden-baslat:
	docker compose down && docker compose up -d --build

## Sadece imajları güncelle (30 sn)
guncelle:
	docker compose pull ghost ghost_db auth_db nginx
	docker compose up -d
	@echo "✅  Güncelleme tamamlandı"

## Canlı loglar
log:
	docker compose logs -f

## Container durumu
durum:
	docker compose ps

## DB şemasını güncelle (tablo ekleme/değişiklik)
db-push:
	docker run --rm \
	  --network gunyayla_internal \
	  -v $(CURDIR)/tools/db:/app -w /app \
	  node:20-alpine \
	  sh -c "DATABASE_URL=postgresql://authuser:AuTh%239Pq4Xv!7Lm2Kr8@auth_db:5432/authdb \
	    ./node_modules/.bin/drizzle-kit push" 2>&1 | tail -3
	@echo "✅ Şema güncellendi"

## Drizzle Studio (tarayıcı → http://localhost:4983)
db-studio:
	NET_NAME=$$(docker compose inspect -f '{{range $_, $n := .Networks}}{{$n.Name}}{{end}}' 2>/dev/null | head -1) && \
	docker run --rm --network="$$NET_NAME" -p 4983:4983 \
	  -v "$$(PWD)/tools/db:/app" -w /app \
	  node:20-alpine sh -c "\
	    DATABASE_URL=postgresql://authuser:AuTh%239Pq4Xv!7Lm2Kr8@auth_db:5432/authdb \
	    ./node_modules/.bin/drizzle-kit studio --port 4983 --host 0.0.0.0"

## PostgreSQL shell
db-shell:
	docker compose exec auth_db psql -U authuser -d authdb

## MySQL shell (Ghost)
db-shell-ghost:
	docker compose exec ghost_db mysql -u ghostuser -pGh0st\!aP7#vR2mK9@Lx4 ghostdb

## Tablo durumu
db-status:
	@echo "=== PostgreSQL (Auth) ==="
	@docker compose exec auth_db psql -U authuser -d authdb -c "\dt"
	@echo ""
	@echo "=== MySQL (Ghost) ==="
	@docker compose exec ghost_db mysql -u ghostuser -pGh0st\!aP7#vR2mK9@Lx4 ghostdb -e "SHOW TABLES;"

## Yedek al
yedek:
	@mkdir -p ./yedekler
	@TARIH=$$(date +%Y%m%d_%H%M); \
	docker compose exec ghost_db mysqldump \
	  -u$$MYSQL_USER -p$$MYSQL_PASSWORD $$MYSQL_DATABASE \
	  > ./yedekler/ghost_$$TARIH.sql && \
	docker compose exec auth_db pg_dump \
	  -U$$POSTGRES_USER $$POSTGRES_DB \
	  > ./yedekler/auth_$$TARIH.sql && \
	docker cp ghost_cms:/var/lib/ghost/content ./yedekler/ghost_content_$$TARIH && \
	echo "✅  Yedek → ./yedekler/"

## Her şeyi sil (DİKKAT)
temizle:
	@echo "⚠️  TÜM VERİLER SİLİNECEK! ENTER ile devam, CTRL+C ile iptal"
	@read onay
	docker compose down -v --rmi local
