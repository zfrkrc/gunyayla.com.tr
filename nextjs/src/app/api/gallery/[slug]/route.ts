import { NextRequest, NextResponse } from "next/server"
import { db, albums, photos } from "@/lib/db"
import { eq, asc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { deleteFile } from "@/lib/storage"

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  const { slug } = await context.params
  const [album] = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1)
  if (!album) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })

  const albumPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.albumId, album.id))
    .orderBy(asc(photos.order))

  return NextResponse.json({ album, photos: albumPhotos })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await context.params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
  }
  if (!["editor", "admin"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  }

  const [album] = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1)
  if (!album) {
    return NextResponse.json({ error: "Albüm bulunamadı" }, { status: 404 })
  }

  const albumPhotos = await db.select().from(photos).where(eq(photos.albumId, album.id))
  await Promise.allSettled(albumPhotos.map(p => deleteFile(`${album.id}/${p.filename}`)))
  await db.delete(albums).where(eq(albums.id, album.id))

  return NextResponse.json({ success: true })
}
