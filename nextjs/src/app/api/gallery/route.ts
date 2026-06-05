import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, albums } from "@/lib/db"
import { eq, desc } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { headers } from "next/headers"

// ── GET /api/gallery — Tüm albümleri listele ─────────────────
export async function GET() {
  try {
    const allAlbums = await db
      .select()
      .from(albums)
      .orderBy(desc(albums.createdAt))

    return NextResponse.json(allAlbums)
  } catch {
    return NextResponse.json({ error: "Veritabanı hatası" }, { status: 500 })
  }
}

// ── POST /api/gallery — Yeni albüm oluştur (editor/admin) ────
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
  }
  if (!["editor", "admin"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, slug, newsPostId } = body

  if (!title || !slug) {
    return NextResponse.json({ error: "Başlık ve slug zorunlu" }, { status: 400 })
  }

  try {
    const [album] = await db.insert(albums).values({
      id:          uuid(),
      title,
      description: description ?? null,
      slug,
      newsPostId:  newsPostId ?? null,
      createdBy:   session.user.id,
    }).returning()

    return NextResponse.json(album, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Albüm oluşturulamadı" }, { status: 500 })
  }
}
