import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, photos, albums } from "@/lib/db"
import { eq, count } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { headers } from "next/headers"
import { uploadFile } from "@/lib/storage"

const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
  }
  if (!["editor", "admin"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  }

  const formData = await req.formData()
  const albumId  = formData.get("albumId") as string
  const caption  = formData.get("caption") as string | null
  const files    = formData.getAll("files") as File[]

  if (!albumId || files.length === 0) {
    return NextResponse.json({ error: "albumId ve dosya zorunlu" }, { status: 400 })
  }

  const [album] = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1)
  if (!album) {
    return NextResponse.json({ error: "Albüm bulunamadı" }, { status: 404 })
  }

  const [{ value: photoCount }] = await db
    .select({ value: count() })
    .from(photos)
    .where(eq(photos.albumId, albumId))

  const uploaded = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${file.name} çok büyük (max 10MB)` }, { status: 400 })
    }

    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const filename = `${uuid()}.${ext}`
    const key      = `${albumId}/${filename}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    const url = await uploadFile(key, buffer, file.type || `image/${ext}`)

    const [photo] = await db.insert(photos).values({
      id:       uuid(),
      albumId,
      filename,
      url,
      caption:  caption ?? null,
      size:     file.size,
      order:    Number(photoCount) + i,
    }).returning()

    if (Number(photoCount) === 0 && i === 0) {
      await db.update(albums)
        .set({ coverImage: url, updatedAt: new Date() })
        .where(eq(albums.id, albumId))
    }

    uploaded.push(photo)
  }

  return NextResponse.json({ uploaded }, { status: 201 })
}
