# 📰 GünYayla Haber Portalı

Ghost CMS + Next.js + Better Auth ile tam özellikli haber, galeri ve yönetim platformu.

## 🧱 Teknolojiler

| Bileşen | Teknoloji |
|---------|-----------|
| CMS | Ghost 5 (headless) |
| Frontend | Next.js 15 |
| Auth | Better Auth (Google OAuth + email/şifre) |
| ORM | Drizzle |
| Kullanıcı DB | PostgreSQL 16 |
| İçerik DB | MySQL 8 |
| Obje Depolama | MinIO (fotoğraf yüklemeleri) |
| Proxy | Nginx (alpine) |
| E-posta | MailHog (geliştirme) / Mailgun (prod) |
| AI | Ollama (gemma3:1b) |
| RSS Bot | Özel Python botu (haber toplama + özet) |

## 🗂 Mimari

```
İnternet → Nginx :${PUBLIC_HTTP_PORT}
               ├── /ghost*          → Ghost CMS (haber editörü)
               ├── /uploads/*       → MinIO (fotoğraflar)
               ├── /admin*          → Next.js (yönetim paneli)
               └── /*               → Next.js (frontend + galeri + auth)

Servisler:
  ghost_db     → MySQL 8 (Ghost içerikleri)
  auth_db      → PostgreSQL 16 (kullanıcılar)
  ghost        → Ghost 5 (headless CMS)
  nextjs       → Next.js 15 (web uygulaması)
  minio        → S3 uyumlu obje depolama
  nginx        → Reverse proxy
  ollama       → AI özet çıkarıcı
  rss-bot      → RSS haber toplama botu
  mailhog      → Geliştirme eposta sunucusu
```

## 📁 Dosya Yapısı

```
gunyayla/
├── docker-compose.yml
├── .env                          ← Şifreler (gizli tut)
├── Makefile                      ← Yönetim komutları
├── nginx/
│   └── default.conf
├── ghost-patches/                ← Ghost'a uygulanan yamalar
│   ├── middleware.js
│   ├── comments.js
│   ├── CommentsController.js
│   ├── routes.js
│   └── apply-patches.sh
├── ghost-content/
│   └── themes/                   ← Ghost temaları
├── bot/
│   ├── Dockerfile
│   └── src/                      ← RSS botu (Python)
└── nextjs/
    ├── Dockerfile
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              ← Ana sayfa
    │   │   ├── login/                ← Giriş / Üye ol
    │   │   ├── sifre-sifirla/        ← Şifre sıfırlama
    │   │   ├── email-dogrula/        ← E-posta doğrulama
    │   │   ├── gallery/              ← Galeri listesi
    │   │   ├── gallery/[slug]/       ← Albüm + lightbox
    │   │   ├── editor/               ← Editör paneli
    │   │   ├── admin/                ← Yönetim paneli
    │   │   │   ├── page.tsx          ← Panel ana sayfa
    │   │   │   ├── feedback/         ← Beğeni istatistikleri
    │   │   │   ├── comments/         ← Yorum yönetimi
    │   │   │   ├── members/          ← Ghost üye listesi
    │   │   │   └── rss-sources/      ← RSS kaynak yönetimi
    │   │   └── api/
    │   │       ├── auth/             ← Better Auth endpoint
    │   │       ├── admin/            ← Admin API
    │   │       │   ├── feedback/
    │   │       │   ├── comments/
    │   │       │   ├── members/
    │   │       │   └── rss-sources/
    │   │       ├── gallery/          ← Albüm API
    │   │       └── upload/           ← MinIO fotoğraf yükleme
    │   ├── components/
    │   │   └── ui/
    │   │       ├── Navbar.tsx
    │   │       ├── Footer.tsx
    │   │       └── NewsCard.tsx
    │   └── lib/
    │       ├── auth.ts               ← Better Auth yapılandırma
    │       ├── auth-client.ts        ← Client hooks
    │       ├── auth-types.ts         ← Client tip tanımları
    │       ├── db.ts                 ← Drizzle + şema
    │       ├── ghost.ts              ← Ghost API helper
    │       └── email.ts              ← E-posta gönderme
    └── package.json
```

---

## 🚀 Kurulum

### 1. .env Düzenle

```bash
nano .env
```

Mutlaka değiştirin:
- `SITE_DOMAIN`, `PUBLIC_HTTP_PORT` → alan adınız / IP
- Tüm şifreler (`MYSQL_*`, `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`)
- `GHOST_CONTENT_API_KEY` → aşağıda açıklandı
- `BETTER_AUTH_SECRET` → `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → aşağıda açıklandı

### 2. Başlat

```bash
make baslat
```

### 3. Ghost Admin Kur

`http://DOMAIN/ghost` → admin hesabı oluşturun.

### 4. Ghost API Key Al

Ghost Admin → **Settings → Integrations → Add custom integration**
→ "Content API Key" değerini `.env`'e yazın.

```bash
make yeniden-baslat
```

### 5. Veritabanı Şeması

```bash
make db-push
```

### 6. Google OAuth (opsiyonel)

1. [console.cloud.google.com](https://console.cloud.google.com) → Yeni proje
2. **APIs & Services → Credentials → OAuth 2.0 Client ID**
3. Authorized redirect URI: `http://DOMAIN/api/auth/callback/google`
4. Client ID + Secret'ı `.env`'e yazın → `make yeniden-baslat`

---

## 👥 Kullanıcı Rolleri

| Rol | Ne yapabilir |
|-----|-------------|
| `reader` | Okuma, beğeni, yorum yapma (varsayılan) |
| `admin` | Admin paneline tam erişim (beğeniler, yorumlar, üyeler, RSS) |

Admin rolü vermek:
```sql
UPDATE "user" SET role = 'admin' WHERE email = 'admin@ornek.com';
```

---

## 📰 Haber Girişi

1. `http://DOMAIN/ghost` → giriş yap
2. **New post** → yaz, resim ekle, yayınla
3. Habere galeri bağlamak için Ghost post ID'sini albüm oluştururken gir

---

## 🖼 Galeri Yönetimi

1. `http://DOMAIN/login` → giriş yap
2. Navbar → **Editör Paneli**
3. **Albüm Oluştur** → yeni albüm
4. **Fotoğraf Yükle** → albüm seç, sürükle-bırak

Fotoğraflar MinIO'ya yüklenir, `http://DOMAIN/uploads/...` adresinden yayınlanır.

Galeri: `http://DOMAIN/galeri`

---

## 🔐 Admin Paneli (yalnızca admin rolü)

| Sayfa | URL | İşlev |
|-------|-----|-------|
| Panel | `/admin` | Özet istatistikler |
| Beğeniler | `/admin/feedback` | Hangi haber kaç beğeni almış |
| Yorumlar | `/admin/comments` | Yorumları onayla/reddet/sil |
| Üyeler | `/admin/members` | Ghost üye listesi |
| RSS Kaynakları | `/admin/rss-sources` | RSS bot kaynak yönetimi |
| Ghost Admin | `/ghost` | CMS yönetimi |

---

## 🧩 Ghost Patch: Yorum Silme

Ghost 5 varsayılanda yorum silmeyi desteklemez. `ghost-patches/` altındaki dosyalar Ghost'un ilgili modüllerine yama olarak uygulanır. Docker başlangıcında `apply-patches.sh` otomatik çalışır.

---

## 🔄 Güncelleme

```bash
make guncelle
```

## 💾 Yedekleme

```bash
make yedek          # ./yedekler/ klasörüne alır

# Otomatik (cron - her gece 02:00):
# 0 2 * * * cd /opt/gunyayla && make yedek
```

## 🛠 Sorun Giderme

```bash
make log            # tüm loglar
make durum          # container durumları

# Tek servis logu:
docker compose logs -f nextjs
docker compose logs -f ghost
docker compose logs -f minio
```
