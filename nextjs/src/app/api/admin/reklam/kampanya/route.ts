import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, adCampaigns } from "@/lib/db"
import { v4 as uuid } from "uuid"
import { headers } from "next/headers"

async function checkAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
  if (!["editor", "admin"].includes(session.user.role as string))
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  return session
}

export async function POST(req: NextRequest) {
  const s = await checkAuth()
  if (s instanceof NextResponse) return s

  const body = await req.json()
  const { adId, clientName, clientContact, startDate, durationMonths, priceAgreed, bannerUrl, bannerMobileUrl, linkUrl, notes } = body
  if (!adId) {
    return NextResponse.json({ error: "Reklam alanı ID zorunlu" }, { status: 400 })
  }

  const [campaign] = await db.insert(adCampaigns).values({
    id: uuid(),
    adId,
    clientName: clientName ?? null,
    clientContact: clientContact ?? null,
    startDate: startDate ? new Date(startDate) : null,
    durationMonths: durationMonths ?? null,
    priceAgreed: priceAgreed ?? null,
    bannerUrl: bannerUrl ?? null,
    bannerMobileUrl: bannerMobileUrl ?? null,
    linkUrl: linkUrl ?? null,
    notes: notes ?? null,
  }).returning()

  return NextResponse.json(campaign, { status: 201 })
}
