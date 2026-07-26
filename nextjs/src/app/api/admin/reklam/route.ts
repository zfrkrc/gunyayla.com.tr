import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, ads, adCampaigns } from "@/lib/db"
import { eq, asc, desc } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { headers } from "next/headers"

async function checkAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 })
  if (!["editor", "admin"].includes(session.user.role as string))
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  return session
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !["editor", "admin"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  }

  const allAds = await db.select().from(ads).orderBy(asc(ads.sortOrder), asc(ads.createdAt))
  const allCampaigns = await db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt))
  const campaignsByAd: Record<string, typeof allCampaigns> = {}
  for (const c of allCampaigns) {
    if (!campaignsByAd[c.adId]) campaignsByAd[c.adId] = []
    campaignsByAd[c.adId].push(c)
  }

  return NextResponse.json({ ads: allAds, campaignsByAd })
}

export async function POST(req: NextRequest) {
  const s = await checkAuth()
  if (s instanceof NextResponse) return s

  const body = await req.json()
  const { title, category, description, price, dimensions, mobileDimensions, channelTag, platform, imageUrl, sortOrder } = body
  if (!title || !category) {
    return NextResponse.json({ error: "Başlık ve kategori zorunlu" }, { status: 400 })
  }

  const [ad] = await db.insert(ads).values({
    id: uuid(),
    title,
    category,
    description: description ?? null,
    price: price ?? null,
    dimensions: dimensions ?? null,
    mobileDimensions: mobileDimensions ?? null,
    channelTag: channelTag ?? null,
    platform: platform ?? "all",
    imageUrl: imageUrl ?? null,
    sortOrder: sortOrder ?? 0,
  }).returning()

  return NextResponse.json(ad, { status: 201 })
}
