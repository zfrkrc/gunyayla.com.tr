import { NextRequest, NextResponse } from "next/server"
import { db, albums, photos } from "@/lib/db"
import { eq, asc } from "drizzle-orm"

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
