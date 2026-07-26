import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys"
import pino from "pino"
import qrcodeTerminal from "qrcode-terminal"
import QRCode from "qrcode"
import { createServer } from "http"

const GHOST_URL = process.env.GHOST_URL || "http://ghost:2368"
const GHOST_CONTENT_KEY = process.env.GHOST_CONTENT_API_KEY
const ADMIN_NUMBERS = (process.env.ADMIN_NUMBERS || "").split(",").map(s => s.trim()).filter(Boolean)
const PORT = parseInt(process.env.PORT || "3000")
const SESSION_DIR = process.env.SESSION_DIR || "/app/sessions"

let sock = null
let lastQrData = null
let connectionStatus = "connecting"
let botNumber = null

async function searchGhost(query) {
  try {
    const params = new URLSearchParams({
      key: GHOST_CONTENT_KEY,
      include: "tags,authors",
      limit: "5",
      order: "published_at DESC",
      filter: `title:~'${query}'`,
    })
    const res = await fetch(`${GHOST_URL}/ghost/api/content/posts/?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.posts || []
  } catch {
    return []
  }
}

async function getLatestPosts(limit = 10) {
  try {
    const params = new URLSearchParams({
      key: GHOST_CONTENT_KEY,
      include: "tags",
      limit: String(limit),
      order: "published_at DESC",
    })
    const res = await fetch(`${GHOST_URL}/ghost/api/content/posts/?${params}`)
    if (!res.ok) return []
    const data = await res.json()
    return data.posts || []
  } catch {
    return []
  }
}

function formatPost(post, index) {
  const date = new Date(post.published_at).toLocaleDateString("tr-TR")
  const url = `${GHOST_URL.replace("http://ghost:2368", "https://gunyayla.com.tr")}/${post.slug}`
  return `${index + 1}. *${post.title}*\n   📅 ${date}\n   🔗 ${url}`
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),

  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      lastQrData = qr
      connectionStatus = "qr"
      console.log("\n📱 WhatsApp QR kodu alındı!")
      qrcodeTerminal.generate(qr, { small: true })
      console.log("👉 http://SUNUCU_IP:3000 adresinden QR'ı görebilirsiniz\n")
    }
    if (connection === "open") {
      connectionStatus = "connected"
      botNumber = sock.user?.id?.split(":")[0] || "bilinmiyor"
      lastQrData = null
      console.log(`✅ WhatsApp bağlantısı başarılı! Bot: ${botNumber}`)
    }
    if (connection === "close") {
      const err = lastDisconnect?.error
      const reason = err?.output?.statusCode
      const errMsg = err?.message || err?.toString?.() || "bilinmiyor"
      connectionStatus = reason === DisconnectReason.loggedOut ? "logged_out" : "reconnecting"
      const shouldReconnect = reason !== DisconnectReason.loggedOut
      console.log(`❌ Bağlantı koptu (kod: ${reason})`)
      console.log(`   Hata: ${errMsg.slice(0, 200)}`)
      if (shouldReconnect) {
        console.log("   5 sn sonra yeniden bağlanılıyor...")
        setTimeout(startBot, 5000)
      }
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
      const from = msg.key.remoteJid
      if (!text || !from) continue

      console.log(`📨 ${from}: ${text.slice(0, 60)}`)

      if (/^(merhaba|selam|hi|hello|hey)$/i.test(text.trim())) {
        await sock.sendMessage(from, {
          text: "👋 Merhaba! *GünYayla Haber Botu*'na hoş geldiniz!\n\nKullanabileceğiniz komutlar:\n• *haber <kelime>* — Haber ara\n  Örn: `haber Yozgat`\n• *son haberler* — En güncel 10 haber\n• *yardım* — Bu mesajı gösterir",
        })
      } else if (/^(yardım|help|komut|komutlar|ne yapabilirsin)$/i.test(text.trim())) {
        await sock.sendMessage(from, {
          text: "🤖 *GünYayla Haber Botu*\n\n📰 *haber <kelime>* — İstediğiniz konuda haber arar\n  Örnek: `haber spor`, `haber yozgat`\n\n📋 *son haberler* — Sitedeki son 10 haberi listeler\n\n👋 *merhaba* — Karşılama mesajı",
        })
      } else if (/^son haber(ler)?$|^güncel$/i.test(text.trim())) {
        await sock.sendMessage(from, { text: "📰 *Son haberler* yükleniyor..." })
        const posts = await getLatestPosts(10)
        if (posts.length === 0) {
          await sock.sendMessage(from, { text: "⚠️ Henüz haber bulunamadı." })
        } else {
          for (let i = 0; i < posts.length; i += 5) {
            const chunk = posts.slice(i, i + 5).map((p, idx) => formatPost(p, i + idx)).join("\n\n")
            await sock.sendMessage(from, { text: chunk })
          }
        }
      } else if (/^haber\s+/i.test(text.trim())) {
        const query = text.replace(/^haber\s+/i, "").trim()
        if (!query || query.length < 2) {
          await sock.sendMessage(from, {
            text: "⚠️ Lütfen en az 2 harfli bir arama kelimesi girin.\nÖrnek: `haber Yozgat`",
          })
        } else {
          await sock.sendMessage(from, { text: `🔍 *"${query}"* için aranıyor...` })
          const posts = await searchGhost(query)
          if (posts.length === 0) {
            await sock.sendMessage(from, { text: `😕 *"${query}"* ile ilgili haber bulunamadı.` })
          } else {
            const lines = posts.map((p, i) => formatPost(p, i))
            await sock.sendMessage(from, {
              text: `📰 *${query}* için ${posts.length} sonuç:\n\n${lines.join("\n\n")}`,
            })
          }
        }
      }
    }
  })
}

function startHttpServer() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost`)

    if (req.method === "POST" && url.pathname === "/notify") {
      let body = ""
      req.on("data", (chunk) => (body += chunk))
      req.on("end", async () => {
        try {
          const { title, url: postUrl, number } = JSON.parse(body)
          const targetNumbers = number ? [number] : ADMIN_NUMBERS
          if (targetNumbers.length === 0) {
            res.writeHead(400).end("ADMIN_NUMBERS not configured")
            return
          }
          if (!sock) {
            res.writeHead(503).end("Bot not connected")
            return
          }
          const message = `📰 *Yeni Haber*\n\n${title}\n\n🔗 ${postUrl}`
          for (const num of targetNumbers) {
            try {
              const jid = num.includes("@s.whatsapp.net") ? num : `${num}@s.whatsapp.net`
              await sock.sendMessage(jid, { text: message })
              console.log(`✅ Bildirim: ${num}`)
            } catch (e) {
              console.error(`❌ WhatsApp hatası: ${num}`, e.message)
            }
          }
          res.writeHead(200).end("ok")
        } catch (e) {
          console.error("/notify error:", e)
          res.writeHead(400).end("invalid json")
        }
      })
      return
    }

    if (url.pathname === "/qr.png" && lastQrData) {
      const png = await QRCode.toBuffer(lastQrData, { width: 400, margin: 2 })
      res.writeHead(200, { "Content-Type": "image/png" }).end(png)
      return
    }

    if (url.pathname === "/qr" && lastQrData) {
      const svg = await QRCode.toString(lastQrData, { type: "svg", width: 300, margin: 2 })
      res.writeHead(200, { "Content-Type": "image/svg+xml" }).end(svg)
      return
    }

    let statusIcon, statusText
    if (connectionStatus === "connected") {
      statusIcon = "✅"
      statusText = `Bağlı (${botNumber})`
    } else if (connectionStatus === "qr") {
      statusIcon = "📱"
      statusText = "QR kodu hazır — WhatsApp ile okutun"
    } else if (connectionStatus === "reconnecting") {
      statusIcon = "🔄"
      statusText = "Yeniden bağlanıyor..."
    } else if (connectionStatus === "logged_out") {
      statusIcon = "❌"
      statusText = "Oturum kapatıldı"
    } else {
      statusIcon = "⏳"
      statusText = "Bağlanıyor..."
    }

    const qrSection = lastQrData ? `
      <div class="qr-container">
        <h2>📱 QR Kodu</h2>
        <p>WhatsApp'ınızla okutun:</p>
        <img src="/qr.svg" alt="QR Code" style="width:300px;height:300px">
        <p style="font-size:12px;color:#888;word-break:break-all;max-width:400px;margin-top:10px">
          Kod: ${lastQrData.slice(0, 60)}...
        </p>
      </div>
    ` : ""

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GünYayla WhatsApp Bot</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; text-align: center; background: #f5f5f5; }
    .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .status { font-size: 18px; margin: 20px 0; }
    .qr-container { margin-top: 20px; padding: 20px; background: #fafafa; border-radius: 8px; }
    h1 { color: #333; font-size: 24px; margin: 0 0 10px; }
    a { color: #1a73e8; }
    .endpoints { margin-top: 20px; font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🤖 GünYayla WhatsApp Bot</h1>
    <div class="status">${statusIcon} ${statusText}</div>
    ${qrSection}
    <div class="endpoints">
      <p><code>POST /notify</code> — Bildirim gönder</p>
      <p><code>GET /qr.svg</code> — QR kodu (SVG)</p>
      <p><code>GET /qr.png</code> — QR kodu (PNG)</p>
    </div>
  </div>
</body>
</html>`
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(html)
  })

  server.listen(PORT, () => {
    console.log(`🔌 HTTP server: port ${PORT}`)
    console.log(`[POST] http://localhost:${PORT}/notify`)
    console.log(`[GET]  http://localhost:${PORT}/  (QR sayfası)`)
    console.log(`👥 Admin numaralar: ${ADMIN_NUMBERS.join(", ") || "yok"}`)
  })
}

console.log("✅ WhatsApp bot başlatılıyor...")
startBot()
startHttpServer()
