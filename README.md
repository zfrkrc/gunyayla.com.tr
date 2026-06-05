# 📰 GünYayla Haber Portalı

Ghost CMS + Next.js + Better Auth ile tam özellikli haber ve galeri platformu.

## 🗂 Mimari

```
İnternet → Nginx :80
              ├── /ghost*       → Ghost CMS (haber editörü)
              ├── /uploads/*    → Statik dosyalar
              └── /*            → Next.js (frontend + galeri + auth)

Veritabanları:
  MySQL      → Ghost içerikleri
  PostgreSQL → Kullanıcılar (Better Auth)
```

## 📁 Dosya Yapısı

```
gunyayla/
├── docker-compose.yml
├── .env                    ← Şifreler (gizli tut)
├── Makefile                ← Yönetim komutları
├── nginx/
│   └── default.conf
└── nextjs/
    ├── Dockerfile
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx           ← Ana sayfa
    │   │   ├── login/             ← Giriş / Üye ol
    │   │   ├── gallery/           ← Galeri listesi
    │   │   ├── gallery/[slug]/    ← Albüm + lightbox
    │   │   ├── editor/            ← Editör paneli
    │   │   └── api/
    │   │       ├── auth/          ← Better Auth endpoint
    │   │       ├── gallery/       ← Albüm API
    │   │       └── upload/        ← Fotoğraf yükleme
    │   ├── components/
    │   │   ├── ui/Navbar.tsx
    │   │   └── news/NewsCard.tsx
    │   └── lib/
    │       ├── auth.ts            ← Better Auth yapılandırma
    │       ├── auth-client.ts     ← Client hooks
    │       ├── db.ts              ← Drizzle + şema
    │       └── ghost.ts           ← Ghost API helper
    └── package.json
```

---

## 🚀 Kurulum

### 1. .env Düzenle

```bash
nano .env
```

Mutlaka değiştirin:
- `SITE_DOMAIN` → alan adınız veya sunucu IP
- Tüm şifreler
- `GHOST_CONTENT_API_KEY` → aşağıda açıklandı
- `BETTER_AUTH_SECRET` → `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → aşağıda açıklandı

### 2. Başlat

```bash
make baslat
```

### 3. Ghost Admin Kur

`http://DOMAIN/ghost` adresine gidin → admin hesabı oluşturun.

### 4. Ghost API Key Al

Ghost Admin → **Settings → Integrations → Add custom integration**
→ "Content API Key" değerini kopyalayın → `.env`'e yapıştırın.

```bash
# .env güncelledikten sonra yeniden başlat:
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
4. Client ID ve Secret'ı `.env`'e yapıştırın → `make yeniden-baslat`

---

## 👥 Kullanıcı Rolleri

| Rol | Ne yapabilir |
|---|---|
| `reader` | Okuma, giriş (varsayılan) |
| `editor` | Galeri albüm/fotoğraf yönetimi + Ghost haberleri |
| `admin` | Her şey |

Editör rolü vermek için veritabanında:
```sql
-- PostgreSQL'de
UPDATE "user" SET role = 'editor' WHERE email = 'editor@ornek.com';
```

Veya Ghost Admin üzerinden editörünüze Ghost erişimi de verebilirsiniz.

---

## 📰 Haber Girişi (Editör için)

1. `http://DOMAIN/ghost` → giriş yap
2. **New post** → yaz, resim ekle, yayınla
3. Habere galeri bağlamak istersen albüm oluştururken Ghost post ID'sini gir

---

## 🖼 Galeri Yönetimi (Editör Paneli)

1. `http://DOMAIN/login` → giriş yap
2. Navbar → **Editör Paneli**
3. **Albüm Oluştur** sekmesi → yeni albüm
4. **Fotoğraf Yükle** sekmesi → albüm seç, fotoğrafları sürükle

Galeri public URL: `http://DOMAIN/galeri`

---

## 🔄 Güncelleme

```bash
make guncelle
```

## 💾 Yedekleme

```bash
make yedek
# ./yedekler/ klasörüne alır

# Otomatik (cron - her gece 02:00):
# crontab -e
# 0 2 * * * cd /opt/gunyayla && make yedek
```

## 🛠 Sorun Giderme

```bash
make log      # tüm loglar
make durum    # container durumları

# Sadece bir servisin logu:
docker compose logs -f nextjs
docker compose logs -f ghost
```
