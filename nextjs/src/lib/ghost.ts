const GHOST_URL = process.env.GHOST_URL || "http://ghost:2368"
const GHOST_KEY = process.env.GHOST_CONTENT_API_KEY
const GHOST_ADMIN_VERSION = process.env.GHOST_ADMIN_VERSION || "v5.130"
const MAX_NOTE_LENGTH = 2000

const ghostFetch = (path: string) => {
  const separator = path.includes("?") ? "&" : "?"
  return fetch(`${GHOST_URL}/ghost/api/content${path}${separator}key=${GHOST_KEY}`, {
    next: { revalidate: 60 },
  })
}

const DOMAIN = process.env.SITE_DOMAIN || "gunyayla.com.tr"
const escapedDomain = DOMAIN.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&")

// Ghost HTML icindeki http://domain → https://domain (mixed content onlemi)
function fixHttps(html?: string) {
  if (!html) return html
  return html.replace(new RegExp("http://" + escapedDomain, "gi"), "https://" + DOMAIN)
}

function fixPost(post: any) {
  if (!post) return post
  if (post.html) {
    post.html = fixHttps(post.html)
    // Ghost internal container URL'lerini public URL'e çevir
    post.html = post.html.replace(/http:\/\/(?:ghost|localhost):\d+\//g, "https://" + DOMAIN + "/")
  }
  if (post.feature_image) {
    post.feature_image = post.feature_image.replace(/^http:\/\/(?:ghost|localhost):\d+\//, "https://" + DOMAIN + "/")
  }
  return post
}

// --- Tum haberler ---
export async function getPosts(page = 1, limit = 12) {
  const res = await ghostFetch(
    `/posts/?limit=${limit}&page=${page}&include=tags,authors&fields=id,title,slug,excerpt,feature_image,published_at,reading_time`
  )
  if (!res.ok) return { posts: [], meta: null }
  const data = await res.json()
  return { posts: (data.posts ?? []).map(fixPost), meta: data.meta }
}

// --- Tek haber (slug ile) ---
export async function getPost(slug: string) {
  const res = await ghostFetch(
    `/posts/slug/${slug}/?include=tags,authors`
  )
  if (!res.ok) return null
  const data = await res.json()
  const post = data.posts?.[0] ?? null
  return fixPost(post)
}

// --- Kategoriye gore haberler ---
export async function getPostsByTag(tag: string, limit = 12) {
  const res = await ghostFetch(
    `/posts/?filter=tag:${tag}&limit=${limit}&include=tags,authors&fields=id,title,slug,excerpt,feature_image,published_at,reading_time`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.posts ?? []).map(fixPost)
}

// --- Kategoriye gore haberler (sayfali) ---
export async function getPostsByTagPaginated(tag: string, page = 1, limit = 12) {
  const res = await ghostFetch(
    `/posts/?filter=tag:${tag}&page=${page}&limit=${limit}&include=tags,authors&fields=id,title,slug,excerpt,feature_image,published_at,reading_time`
  )
  if (!res.ok) return { posts: [], meta: null }
  const data = await res.json()
  return { posts: (data.posts ?? []).map(fixPost), meta: data.meta }
}

// --- Tum etiketler ---
export async function getTags() {
  const res = await ghostFetch(`/tags/?limit=20&include=`)
  if (!res.ok) return []
  const data = await res.json()
  return data.tags ?? []
}

// --- Site ayarlari (baslik, logo, aciklama) ---
export async function getSiteSettings() {
  try {
    const res = await ghostFetch("/settings/")
    if (!res.ok) return null
    const data = await res.json()
    return data.settings ?? null
  } catch {
    return null
  }
}

// --- Sayfalar ---
export async function getPage(slug: string) {
  const res = await ghostFetch(`/pages/slug/${slug}/`)
  if (!res.ok) return null
  const data = await res.json()
  return data.pages?.[0] ?? null
}

// --- Ghost Admin API JWT token ---
export async function ghostAdminToken() {
  const key = process.env.GHOST_ADMIN_API_KEY
  if (!key) return null

  const [id, secret] = key.split(":")
  const iat = Math.floor(Date.now() / 1000)
  const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString("base64url")
  const header = b64({ alg: "HS256", kid: id, typ: "JWT" })
  const payload = b64({ iat, exp: iat + 300, aud: "/admin/" })

  const { createHmac } = await import("crypto")
  const sig = createHmac("sha256", Buffer.from(secret, "hex"))
    .update(`${header}.${payload}`)
    .digest("base64url")

  return `${header}.${payload}.${sig}`
}

export async function ghostAdminFetch(path: string, options: RequestInit = {}) {
  const token = await ghostAdminToken()
  if (!token) return null
  const url = process.env.GHOST_URL || "http://ghost:2368"
  return fetch(`${url}/ghost/api/admin${path}`, {
    ...options,
    headers: {
      Authorization: `Ghost ${token}`,
      "Accept-Version": GHOST_ADMIN_VERSION,
      "Content-Type": "application/json",
      "X-Forwarded-Proto": "https",
      ...options.headers,
    },
  })
}

function truncateNote(note: string) {
  if (note.length <= MAX_NOTE_LENGTH) return note
  // En eski satırları at, en yenileri koru
  const lines = note.split("\n")
  while (lines.join("\n").length > MAX_NOTE_LENGTH && lines.length > 1) {
    lines.shift()
  }
  return lines.join("\n")
}

// --- Ghost Admin API: member bul (email ile) ---
async function findGhostMember(email: string): Promise<{ id: string; note: string | null } | null> {
  const res = await ghostAdminFetch(`/members/?filter=email:${encodeURIComponent(email)}`)
  if (!res || !res.ok) return null
  const data = await res.json()
  if (!data.members?.[0]) return null
  return { id: data.members[0].id, note: data.members[0].note ?? null }
}

// --- Ghost Admin API: member guncelle ---
async function updateGhostMember(id: string, note: string) {
  const res = await ghostAdminFetch(`/members/${id}/`, {
    method: "PUT",
    body: JSON.stringify({ members: [{ id, note }] }),
  })
  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    console.error("Ghost member update failed:", res?.status, text)
  }
}

function formatDate() {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// --- Ghost Admin API: member olustur veya nota ekleme yap ---
export async function syncGhostMember(email: string, name: string, prefix: string) {
  const now = formatDate()
  const line = `${prefix} ${now}`

  const existing = await findGhostMember(email)
  if (existing) {
    const newNote = truncateNote(existing.note ? existing.note + "\n" + line : line)
    await updateGhostMember(existing.id, newNote)
    return
  }
  // Yeni member olustur
  const res = await ghostAdminFetch("/members/", {
    method: "POST",
    body: JSON.stringify({ members: [{ email, name, note: line }] }),
  })
  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    console.error("Ghost member create failed:", res?.status, text)
  }
}
