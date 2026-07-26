import Parser from "rss-parser"
import { createHmac } from "crypto"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { dirname } from "path"
import { fileURLToPath } from "url"

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

const __dirname = dirname(fileURLToPath(import.meta.url))

const GHOST_URL = process.env.GHOST_URL || "http://ghost:2368"
const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_API_KEY
const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:1b"
const STATE_FILE = process.env.STATE_FILE || "/data/processed-guids.json"
const SOURCES_FILE = "/data/sources.json"
const NEWSLETTER_ID = process.env.NEWSLETTER_ID || ""

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["image", "image", { keepArray: false }],
    ],
  },
})

if (!GHOST_ADMIN_KEY) {
  console.error("❌ GHOST_ADMIN_API_KEY gerekli")
  process.exit(1)
}

function loadSources() {
  try {
    if (existsSync(SOURCES_FILE)) {
      const data = JSON.parse(readFileSync(SOURCES_FILE, "utf-8"))
      if (Array.isArray(data) && data.length > 0) return data
    }
  } catch (e) {
    console.error("  sources.json okuma hatası:", e.message)
  }
  const defaults = [
    { name: "Yozgat Çamlık",     url: "https://www.yozgatcamlik.com/rss/" },
    { name: "Yozgat Hakimiyet",  url: "https://www.yozgathakimiyet.com.tr/feed/" },
    { name: "Yozgat Olay",       url: "https://www.yozgatolay.com/feed/" },
    { name: "İleri Gazetesi",    url: "https://www.ilerigazetesi.com.tr/rss/" },
    { name: "Merhaba Yozgat",    url: "https://merhabayozgat.com/rss/" },
  ]
  try {
    const dir = dirname(SOURCES_FILE)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(SOURCES_FILE, JSON.stringify(defaults, null, 2))
  } catch {}
  return defaults
}

function extractImage(item) {
  if (item.image) return item.image
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

function extractContent(item) {
  const raw = item["content:encoded"] || item.content || item.contentSnippet || ""
  if (!raw) return null

  const pTags = raw.match(/<p[^>]*>([\s\S]*?)<\/p>/gi)
  let text = ""
  if (pTags && pTags.length > 0) {
    const count = Math.min(pTags.length, 5)
    for (let i = 0; i < count; i++) {
      text += pTags[i].replace(/<[^>]+>/g, "").trim() + "\n\n"
    }
  } else {
    text = raw.replace(/<[^>]+>/g, "").trim()
  }

  text = text.trim()
  if (!text) return null

  if (text.length > 2000) {
    text = text.slice(0, 2000).replace(/\s+\S*$/, "") + "..."
  }
  return text
}

function buildMobiledoc(content, imageUrl, sourceUrl, sourceName) {
  const cards = []
  const markups = []
  const sections = []

  if (imageUrl) {
    cards.push(["image", { src: imageUrl }])
    sections.push([10, cards.length - 1])
  }

  if (content) {
    const clean = content.replace(/<[^>]+>/g, "").trim()
    if (clean) {
      sections.push([1, "p", [[0, [], 0, clean]]])
    }
  }

  if (sourceUrl && sourceName) {
    markups.push(["a", ["href", sourceUrl, "target", "_blank", "rel", "noopener noreferrer"]])
    sections.push([1, "p", [
      [0, [], 0, "📰 Kaynak: "],
      [0, [0], sourceName.length, sourceName],
    ]])
  }

  return JSON.stringify({
    version: "0.3.1",
    atoms: [],
    cards,
    markups,
    sections,
  })
}

async function summarizeArticle(title, content) {
  const prompt = `Şu haberi 3-4 cümleyle özetle:\n\nBaşlık: ${title}\n\n${content || ""}\n\nÖzet:`

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { num_predict: 200, temperature: 0.3 },
    }),
  })

  if (!res.ok) {
    console.error(`  Ollama hatası: ${res.status}`)
    return null
  }
  const data = await res.json()
  const text = data.response?.trim()
  if (!text || text.length < 20 || /tamamdır|elbette|tabii/i.test(text)) return null
  return text
}

async function fetchPost(postId) {
  const res = await ghostFetch(`/posts/${postId}/?fields=id,title,updated_at`)
  if (!res || !res.ok) return null
  const data = await res.json()
  return data.posts?.[0] || null
}

async function findPostBySlug(slug) {
  const res = await ghostFetch(`/posts/slug/${slug}/`)
  if (!res || !res.ok) return null
  const data = await res.json()
  return data.posts?.[0] || null
}

async function createPost(title, content, imageUrl, sourceName, sourceUrl) {
  const mobiledoc = buildMobiledoc(content, imageUrl, sourceUrl, sourceName)

  const body = {
    posts: [{
      title,
      mobiledoc,
      status: "published",
      visibility: "public",
      tags: [{ name: "otomatik", slug: "otomatik" }],
      feature_image: imageUrl || undefined,
      ...(NEWSLETTER_ID ? {
        newsletter_id: NEWSLETTER_ID,
        email_recipient_filter: "all",
      } : {}),
    }],
  }

  const res = await ghostFetch("/posts/", {
    method: "POST",
    body: JSON.stringify(body),
  })

  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    console.error(`  Ghost post oluşturma hatası: ${res?.status} ${text}`)
    return null
  }
  const data = await res.json()
  return data.posts?.[0]?.id || null
}

async function updatePost(postId, newTitle, newContent, newImageUrl, sourceName, sourceUrl) {
  const current = await fetchPost(postId)
  if (!current) {
    console.error("  Post bulunamadı, güncelleme iptal")
    return false
  }

  const mobiledoc = buildMobiledoc(newContent, newImageUrl, sourceUrl, sourceName)

  const res = await ghostFetch(`/posts/${postId}/`, {
    method: "PUT",
    body: JSON.stringify({
      posts: [{
        id: postId,
        title: newTitle,
        mobiledoc,
        updated_at: current.updated_at,
      }],
    }),
  })

  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    if (res?.status === 409) {
      console.error("  Çakışma, sonraki turda tekrar denenir")
    } else {
      console.error(`  Ghost post güncelleme hatası: ${res?.status} ${text}`)
    }
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

function isBadSummary(text) {
  return !text || text.length < 20 || /tamamdır|elbette|tabii|isteğiniz|buraya/i.test(text)
}

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
      item.title = decodeEntities(item.title || "")
      if (item["content:encoded"]) item["content:encoded"] = decodeEntities(item["content:encoded"])
      if (item.content) item.content = decodeEntities(item.content)

      const guid = item.guid || item.link || item.title
      if (!guid) continue

      if (state.processed[guid] === "rewritten") continue

      const prevState = state.processed[guid]
      let postId = state.postIds?.[guid]

      if (prevState === "created" && postId) {
        console.log(`  🔄 ${item.title?.slice(0, 60)}... (özet yenileniyor)`)

        const content = extractContent(item)
        let summary
        try {
          summary = await summarizeArticle(item.title, content)
        } catch (e) {
          console.log(`    Özet hatası: ${e.message?.slice(0, 60)}, atlanıyor`)
          continue
        }
        if (isBadSummary(summary)) {
          console.log("    Özet başarısız, kaynak link korunuyor")
          state.processed[guid] = "rewritten"
          continue
        }
        console.log(`    📝 Özet: ${summary.slice(0, 80)}...`)

        const imageUrl = extractImage(item)
        const ok = await updatePost(postId, item.title, summary, imageUrl, source.name, item.link)
        if (ok) {
          state.processed[guid] = "rewritten"
          rewriteCount++
          console.log("    ✅ Post güncellendi")
        }
        continue
      }

      if (!prevState) {
        const slug = makeSlug(item.title)
        const existing = await findPostBySlug(slug)
        if (existing) {
          console.log(`  ⏭ ${item.title?.slice(0, 60)}... (zaten var, ID kaydediliyor)`)
          state.processed[guid] = "created"
          if (!state.postIds) state.postIds = {}
          state.postIds[guid] = existing.id
          continue
        }
      }

      console.log(`  ➜ ${item.title?.slice(0, 60)}...`)

      const imageUrl = extractImage(item)
      if (imageUrl) console.log(`    🖼️ Resim: ${imageUrl.slice(0, 60)}...`)

      const content = extractContent(item)
      if (!content) {
        console.log("    İçerik alınamadı, atlanıyor")
        continue
      }
      console.log(`    📝 İçerik: ${content.slice(0, 80)}...`)

      const newPostId = await createPost(item.title, content, imageUrl, source.name, item.link)
      if (newPostId) {
        state.processed[guid] = "created"
        if (!state.postIds) state.postIds = {}
        state.postIds[guid] = newPostId
        newCount++
        console.log("    ✅ Yayınlandı")
      }
    }
  }

  saveState(state)
  console.log(`\n✅ İşlem tamam. ${newCount} yeni post yayınlandı, ${rewriteCount} güncelleme.`)
}

run().then(() => process.exit(0)).catch((e) => {
  console.error("❌ Hata:", e)
  process.exit(1)
})
