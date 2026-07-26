import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, adCampaigns } from "@/lib/db"
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
  const { clientName, clientContact, startDate, durationMonths, priceAgreed, bannerUrl, bannerMobileUrl, linkUrl, notes, status } = body

  const [campaign] = await db.update(adCampaigns).set({
    ...(clientName !== undefined && { clientName }),
    ...(clientContact !== undefined && { clientContact }),
    ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
    ...(durationMonths !== undefined && { durationMonths }),
    ...(priceAgreed !== undefined && { priceAgreed }),
    ...(bannerUrl !== undefined && { bannerUrl }),
    ...(bannerMobileUrl !== undefined && { bannerMobileUrl }),
    ...(linkUrl !== undefined && { linkUrl }),
    ...(notes !== undefined && { notes }),
    ...(status !== undefined && { status }),
    updatedAt: new Date(),
  }).where(eq(adCampaigns.id, id)).returning()

  if (!campaign) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
  return NextResponse.json(campaign)
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const s = await checkAuth()
  if (s instanceof NextResponse) return s

  const { id } = await context.params
  await db.delete(adCampaigns).where(eq(adCampaigns.id, id))
  return NextResponse.json({ success: true })
}
