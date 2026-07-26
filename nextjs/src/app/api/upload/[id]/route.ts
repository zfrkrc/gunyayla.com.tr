import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, photos } from "@/lib/db"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { deleteFile } from "@/lib/storage"

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
  }
  if (!["editor", "admin"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  }

  const [photo] = await db.select().from(photos).where(eq(photos.id, id)).limit(1)
  if (!photo) {
    return NextResponse.json({ error: "Fotoğraf bulunamadı" }, { status: 404 })
  }

  await deleteFile(`${photo.albumId}/${photo.filename}`)
  await db.delete(photos).where(eq(photos.id, id))

  return NextResponse.json({ success: true })
}
