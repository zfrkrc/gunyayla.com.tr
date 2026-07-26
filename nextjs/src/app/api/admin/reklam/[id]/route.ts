import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, ads } from "@/lib/db"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

async function checkAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
  if (!["editor", "admin"].includes(session.user.role as string))
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  return session
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const s = await checkAuth()
  if (s instanceof NextResponse) return s

  const { id } = await context.params
  const body = await req.json()
  const { title, category, description, price, dimensions, mobileDimensions, channelTag, platform, imageUrl, sortOrder, status } = body

  const [ad] = await db.update(ads).set({
    ...(title !== undefined && { title }),
    ...(category !== undefined && { category }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price }),
    ...(dimensions !== undefined && { dimensions }),
    ...(mobileDimensions !== undefined && { mobileDimensions }),
    ...(channelTag !== undefined && { channelTag }),
    ...(platform !== undefined && { platform }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(sortOrder !== undefined && { sortOrder }),
    ...(status !== undefined && { status }),
    updatedAt: new Date(),
  }).where(eq(ads.id, id)).returning()

  if (!ad) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
  return NextResponse.json(ad)
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const s = await checkAuth()
  if (s instanceof NextResponse) return s

  const { id } = await context.params
  await db.delete(ads).where(eq(ads.id, id))
  return NextResponse.json({ success: true })
}
