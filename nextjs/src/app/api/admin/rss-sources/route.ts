import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { dirname } from "path"
import { checkAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

const SOURCES_FILE = "/data/sources.json"

type Source = { name: string; url: string }

function ensureFile() {
  const dir = dirname(SOURCES_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (!existsSync(SOURCES_FILE)) {
    const defaults = [
      { name: "Yozgat Çamlık", url: "https://www.yozgatcamlik.com/rss/" },
      { name: "Yozgat Hakimiyet", url: "https://www.yozgathakimiyet.com.tr/feed/" },
      { name: "Yozgat Olay", url: "https://www.yozgatolay.com/feed/" },
      { name: "İleri Gazetesi", url: "https://www.ilerigazetesi.com.tr/rss/" },
      { name: "Merhaba Yozgat", url: "https://merhabayozgat.com/rss/" },
    ]
    writeFileSync(SOURCES_FILE, JSON.stringify(defaults, null, 2))
  }
}

function readSources(): Source[] {
  ensureFile()
  try {
    return JSON.parse(readFileSync(SOURCES_FILE, "utf-8"))
  } catch {
    return []
  }
}

function writeSources(sources: Source[]) {
  ensureFile()
  writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2))
}

export async function GET() {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const sources = readSources()
  return NextResponse.json(sources)
}

export async function POST(req: Request) {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const body = await req.json()
  if (!body.name?.trim() || !body.url?.trim()) {
    return NextResponse.json({ error: "İsim ve URL gerekli" }, { status: 400 })
  }

  const sources = readSources()
  sources.push({ name: body.name.trim(), url: body.url.trim() })
  writeSources(sources)

  return NextResponse.json({ success: true, sources })
}

export async function PUT(req: Request) {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const body = await req.json()
  if (body.index === undefined) {
    return NextResponse.json({ error: "index gerekli" }, { status: 400 })
  }

  const sources = readSources()
  if (body.index < 0 || body.index >= sources.length) {
    return NextResponse.json({ error: "Geçersiz index" }, { status: 400 })
  }

  if (body.name?.trim()) sources[body.index].name = body.name.trim()
  if (body.url?.trim()) sources[body.index].url = body.url.trim()
  writeSources(sources)

  return NextResponse.json({ success: true, sources })
}

export async function DELETE(req: Request) {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const body = await req.json()
  if (body.index === undefined) {
    return NextResponse.json({ error: "index gerekli" }, { status: 400 })
  }

  const sources = readSources()
  if (body.index < 0 || body.index >= sources.length) {
    return NextResponse.json({ error: "Geçersiz index" }, { status: 400 })
  }

  sources.splice(body.index, 1)
  writeSources(sources)

  return NextResponse.json({ success: true, sources })
}
