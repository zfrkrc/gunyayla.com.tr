import Parser from "rss-parser"
import { createHmac } from "crypto"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const GHOST_URL = process.env.GHOST_URL || "http://ghost:2368"
const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_API_KEY
const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:1b"
const STATE_FILE = process.env.STATE_FILE || "/data/processed-guids.json"
const SOURCES_FILE = "/data/sources.json"

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
    ],
  },
})

if (!GHOST_ADMIN_KEY) {
  console.error("❌ GHOST_ADMIN_API_KEY gerekli")
  process.exit(1)
}

// ── Kaynakları oku ──────────────────────────────────────────
function loadSources() {
  try {
    if (existsSync(SOURCES_FILE)) {
      const data = JSON.parse(readFileSync(SOURCES_FILE, "utf-8"))
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch (e) {
    console.error("  sources.json okuma hatası:", e.message)
  }
  // Varsayılan kaynaklar
  const defaults = [
    { name: "Yozgat Çamlık",     url: "https://www.yozgatcamlik.com/rss/" },
    { name: "Yozgat Hakimiyet",  url: "https://www.yozgathakimiyet.com.tr/feed/" },
    { name: "Yozgat Olay",       url: "https://www.yozgatolay.com/feed/" },
    { name: "İleri Gazetesi",    url: "https://www.ilerigazetesi.com.tr/rss/" },
    { name: "Merhaba Yozgat",    url: "https://merhabayozgat.com/rss/" },
  ]
  // Varsayılanları kaydet
  try {
    const dir = dirname(SOURCES_FILE)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(SOURCES_FILE, JSON.stringify(defaults, null, 2))
  } catch {}
  return defaults
}

// ── RSS'den resim çıkar ─────────────────────────────────────
function extractImage(item) {
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) {
    return item.enclosure.url
  }
  if (item.mediaContent?.$) return item.mediaContent.$.url
  if (item.mediaThumbnail?.$) return item.mediaThumbnail.$.url
  const content = item["content:encoded"] || item.content || ""
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (m) return m[1]
  return null
}

// ── Ghost Admin JWT ─────────────────────────────────────────
function ghostToken(key) {
  const [id, secret] = key.split(":")
  const iat = Math.floor(Date.now() / 1000)
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url")
  const header = b64({ alg: "HS256", kid: id, typ: "JWT" })
  const payload = b64({ iat, exp: iat + 300, aud: "/admin/" })
  const sig = createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`${header}.${payload}`)
    .digest("base64url")
  return `${header}.${payload}.${sig}`
}

async function ghostFetch(path, options = {}) {
  const token = ghostToken(GHOST_ADMIN_KEY)
  const res = await fetch(`${GHOST_URL}/ghost/api/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Ghost ${token}`,
      "Accept-Version": "v5.130",
      "Content-Type": "application/json",
      "X-Forwarded-Proto": "https",
      ...options.headers,
    },
  })
  return res
}

// ── State (işlenmiş GUID'ler) ──────────────────────────────
function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8"))
    }
  } catch {}
  return { processed: {} }
}

function saveState(state) {
  const dir = dirname(STATE_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

// ── RSS içeriğinden ilk 1-2 paragraf çıkar ──────────────────
function extractFirstParagraphs(item) {
  const raw = item["content:encoded"] || item.content || item.contentSnippet || ""
  if (!raw) return null

  // HTML içinden <p>...</p> etiketlerini bul
  const pTags = raw.match(/<p[^>]*>([\s\S]*?)<\/p>/gi)
  let text = ""
  if (pTags && pTags.length > 0) {
    const count = Math.min(pTags.length, 2)
    for (let i = 0; i < count; i++) {
      text += pTags[i].replace(/<[^>]+>/g, "").trim() + "\n\n"
    }
  } else {
    // <p> yoksa düz metin al, kısalt
    text = raw.replace(/<[^>]+>/g, "").trim()
  }

  text = text.trim()
  // 400 karakter sınırı
  if (text.length > 400) {
    text = text.slice(0, 400).replace(/\s+\S*$/, "") + "..."
  }
  return text || null
}

// ── Ollama yeniden yaz ──────────────────────────────────────
async function rewriteArticle(title, content) {
  const prompt = `Aşağıdaki haberi farklı bir bakış açısıyla, farklı kelimeler kullanarak yeniden yaz. Cevabında önce yeni başlığı yaz, sonra iki satır boşluk bırak, sonra haber metnini yaz. Başlık max 10 kelime olsun. Türkçe yaz. Haber aynı olsun ama anlatım tarzı tamamen farklı olsun.

Orijinal Başlık: ${title}
Orijinal İçerik: ${content || "İçerik bulunamadı"}

Yeni Başlık:
[buraya yeni başlık]

Yeni İçerik:
[buraya yeni içerik]`

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { num_predict: 400, temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    console.error(`  Ollama rewrite hatası: ${res.status}`)
    return null
  }
  const data = await res.json()
  const text = data.response?.trim()
  if (!text) return null

  // Yanıttan başlık ve içerik ayır
  const parts = text.split(/\n\n+/)
  const newTitle = parts[0]?.replace(/^["*]|["*]$/g, "").trim() || title
  const newContent = parts.slice(1).join("\n\n").trim()
  if (!newContent) return null

  return { title: newTitle, content: newContent }
}

// ── Ghost'ta slug'a göre post bul ───────────────────────────
async function findPostBySlug(slug) {
  const res = await ghostFetch(`/posts/slug/${slug}/`)
  if (!res || !res.ok) return null
  const data = await res.json()
  return data.posts?.[0] || null
}

// ── Ghost draft oluştur ─────────────────────────────────────
async function createDraft(title, excerpt, sourceName, sourceUrl, imageUrl) {
  const srcLink = `<p style="margin-top:12px"><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600">📰 Kaynağa git →</a></p>`
  const content = excerpt || `<p><em>Bu haber ${sourceName} kaynağından alınmıştır.</em></p>`
  const html = [
    content,
    srcLink,
    `<hr><p style="color:#888;font-size:0.9em">Kaynak: <a href="${sourceUrl}">${sourceName}</a></p>`,
  ].filter(Boolean).join("\n")

  const body = {
    posts: [{
      title,
      html: html || `<p>${title}</p>`,
      excerpt: excerpt || title,
      status: "draft",
      visibility: "public",
      tags: [{ name: "otomatik", slug: "otomatik" }],
    }],
  }

  if (imageUrl) {
    body.posts[0].feature_image = imageUrl
  }

  const res = await ghostFetch("/posts/", {
    method: "POST",
    body: JSON.stringify(body),
  })

  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    console.error(`  Ghost post oluşturma hatası: ${res?.status} ${text}`)
    return false
  }
  return true
}

// ── Ghost post güncelle (yeniden yaz) ───────────────────────
async function updatePost(postId, newTitle, newContent, sourceName, sourceUrl) {
  const srcLink = `<p style="margin-top:12px"><a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600">📰 Kaynağa git →</a></p>`
  const content = newContent || `<p><em>Bu haber ${sourceName} kaynağından alınmıştır.</em></p>`
  const html = [
    content,
    srcLink,
    `<hr><p style="color:#888;font-size:0.9em">Kaynak: <a href="${sourceUrl}">${sourceName}</a></p>`,
  ].filter(Boolean).join("\n")

  const res = await ghostFetch(`/posts/${postId}/`, {
    method: "PUT",
    body: JSON.stringify({
      posts: [{
        id: postId,
        title: newTitle,
        html: html || newTitle,
        updated_at: new Date().toISOString(),
      }],
    }),
  })

  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    console.error(`  Ghost post güncelleme hatası: ${res?.status} ${text}`)
    return false
  }
  return true
}

function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50)
}

// ── Ana döngü ───────────────────────────────────────────────
async function run() {
  console.log(`\n[${new Date().toISOString()}] Bot başladı`)
  const state = loadState()
  const sources = loadSources()
  let newCount = 0
  let rewriteCount = 0

  for (const source of sources) {
    console.log(`\n📡 ${source.name}: ${source.url}`)
    let feed
    try {
      feed = await parser.parseURL(source.url)
    } catch (e) {
      console.error(`  RSS okuma hatası: ${e.message}`)
      continue
    }

    const items = feed.items?.slice(0, 10) || []
    console.log(`  ${items.length} haber bulundu`)

    for (const item of items) {
      const guid = item.guid || item.link || item.title
      if (!guid) continue

      if (state.processed[guid]) {
        continue
      }

      const slug = makeSlug(item.title)
      const existing = await findPostBySlug(slug)

      if (existing) {
        console.log(`  🔄 ${item.title?.slice(0, 60)}... (zaten var, yeniden yazılıyor)`)
        const rewritten = await rewriteArticle(item.title, item.contentSnippet || item.content || item.title)
        if (!rewritten) {
          console.log("    Yeniden yazma başarısız, atlanıyor")
          state.processed[guid] = true
          continue
        }
        console.log(`    📝 Yeni başlık: ${rewritten.title.slice(0, 60)}...`)
        const ok = await updatePost(existing.id, rewritten.title, rewritten.content, source.name, item.link)
        if (ok) {
          state.processed[guid] = true
          rewriteCount++
          console.log("    ✅ Post güncellendi (yeniden yazıldı)")
        }
        continue
      }

      console.log(`  ➜ ${item.title?.slice(0, 60)}...`)

      const imageUrl = extractImage(item)
      if (imageUrl) console.log(`    🖼️ Resim: ${imageUrl.slice(0, 60)}...`)

      const excerpt = extractFirstParagraphs(item)
      if (!excerpt) {
        console.log("    İçerik alınamadı, atlanıyor")
        continue
      }
      console.log(`    📝 İçerik: ${excerpt.slice(0, 80)}...`)

      const ok = await createDraft(item.title, excerpt, source.name, item.link, imageUrl)
      if (ok) {
        state.processed[guid] = true
        newCount++
        console.log("    ✅ Draft oluşturuldu")
      }
    }
  }

  saveState(state)
  console.log(`\n✅ İşlem tamam. ${newCount} yeni draft, ${rewriteCount} güncelleme.`)
}

run().catch((e) => console.error("❌ Hata:", e))
