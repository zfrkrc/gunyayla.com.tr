# AGENTS.md — GünYayla Projesi

## Son Durum (2026-06-09)

Her şey çalışıyor.

---

## Yapılanlar

### 1. Özel Yorum Sistemi
Ghost Admin API yorum ekleme `member_id` zorunlu kıldığı için kendi yorum sistemimizi kurduk:

- **DB tabloları** (`auth_db`): `comments` (post_id, name, email, content, parent_id, status) + `post_feedback` (post_id, email, score)
- **API**: `GET /api/comments?postId=` (yorumları listele, **üyelere özel**, auth gerekli)
- **API**: `POST /api/comments` (yorum ekleme, **üyelere özel**, Cloudflare Turnstile doğrulamalı)
- **API**: `POST /api/feedback` (beğeni/beğenmeme, **herkese açık**), `GET /api/feedback?postId=` (sayıları getir)
- **Component**: `Comments.tsx` — `useSession()` ile giriş kontrolü, giriş yapmamış kullanıcıya login yönlendirmesi, yanıtlama desteği, nested görünüm
- **Entegrasyon**: `[...slug]/page.tsx` post altına `Comments` componenti eklendi
- **Cloudflare Turnstile**: Yorum formunda bot koruması, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` env'lerinden yapılandırılır

### 2. Mailgun + Newsletter
- Mailgun ayarları düzeltildi (`gunyayla.com.tr`, yeni API key)
- Tekil e-posta gönderimi çalışıyor
- Toplu gönderim `"Domain is not allowed to send large batches yet"` hatası veriyor → Mailgun dashboard'dan Large Batch Sending aktifleştirilmeli
- RSS bot'una `NEWSLETTER_ID` ve `email_recipient_filter: "all"` eklendi
- Abonelik formu: `POST /api/subscribe` (Ghost Admin API ile member + newsletter aboneliği)
- `SubscribeButton.tsx` component'i footer'da her sayfada görünür

### 3. /koy Sayfası
- `nextjs/src/app/koy/page.tsx` — "köy" tag'li haberler, LoadMore ile sayfalama, reklamsız
- Foot'a `/koy` linki eklendi

### 4. Root URL Haber Gösterimi
- `[...slug]/page.tsx` artık haber postlarını root URL'de render ediyor (redirect yok)
- Ghost e-posta linklerindeki hash fragment'leri (`#/feedback/...`, `#/portal/...`, `#/comments/...`) korunuyor

### 5. Kullanıcı Yönetimi
- Test hesapları temizlendi (@gunyayla.com, @zk.net.tr vs.)
- Mehmet Akif Acer (`Crespo@hotmail.com.tr`) editor rolüyle eklendi
- Admin kullanıcılar: `zfrkrc@gmail.com`, `badekeba@gmail.com`

### 6. Altyapı
- 11 Docker servisi (ghost_db, auth_db, ghost, nextjs, minio, nginx, ollama, rss-bot, mailhog, minio-setup, whatsapp-bot)
- Nginx: `/r/` (email tracking), `/unsubscribe/`, sitemap/robots rotaları Ghost proxy'ye eklendi
- Ghost Admin API endpoint'leri haritalandı: `comments.js`, `comments-members.js`, `feedback-members.js`
- Ghost URL: `https://gunyayla.com.tr` olarak güncellendi (email linkleri düzgün çalışsın diye)

### 7. Ghost Patch (Yorum Silme)
- `ghost-patches/` ile Ghost 5 yorum silme desteği
- 4 dosya yamalı: `middleware.js`, `comments.js`, `CommentsController.js`, `routes.js`
- `apply-patches.sh` ile Docker başlangıcında uygulanır

---

## Devam Etmek İçin

### Komutlar
- `make baslat` — tüm servisleri başlat
- `make log` — logları izle
- `make durum` — container durumu
- `make yeniden-baslat` — yeniden başlat
- `make whatsapp-qr` — WhatsApp bağlantı QR kodunu göster
- `make whatsapp-log` — WhatsApp bot canlı log

### Önemli Dosyalar
- `nextjs/src/lib/db.ts` → Drizzle şeması (user, session, account, verification, albums, photos, ads, adCampaigns, **comments**, **postFeedback**)
- `nextjs/src/app/api/comments/route.ts` → yorum API (auth + Turnstile)
- `nextjs/src/app/api/feedback/route.ts` → geri bildirim API (public)
- `nextjs/src/components/Comments.tsx` → yorum componenti (useSession, Turnstile, nested replies)
- `nextjs/src/app/[...slug]/page.tsx` → post sayfası (+ Comments)
- `nextjs/src/app/koy/page.tsx` → köy haberleri
- `nextjs/src/lib/ghost.ts` → Ghost API helper'ları
- `nextjs/src/lib/auth.ts` → Better Auth + checkAdmin()
- `nextjs/src/lib/auth-client.ts` → client-side auth (useSession, signIn, signOut)

### Environment
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Turnstile widget site key (client)
- `TURNSTILE_SECRET_KEY` — Turnstile sunucu doğrulama anahtarı

### Dağıtım
- Next.js build: `.next/` + `public/` → tar.gz → scp → docker cp → restart
- Build alırken `.env`'de `NEXT_PUBLIC_*` değişkenleri set edilmeli (build-time inlined)
- Docker compose: `/opt/gunyayla/docker-compose.yml`

### SSH
- `sshpass -p '818357Zk' ssh harbor@172.16.16.200`
