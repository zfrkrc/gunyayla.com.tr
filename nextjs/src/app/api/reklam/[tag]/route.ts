import { NextRequest, NextResponse } from "next/server"
import { db, ads, adCampaigns } from "@/lib/db"
import { eq, asc } from "drizzle-orm"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tag: string }> }
): Promise<NextResponse> {
  const { tag } = await context.params

  const [ad] = await db
    .select()
    .from(ads)
    .where(eq(ads.channelTag, tag))
    .limit(1)

  if (!ad) {
    const [adById] = await db
      .select()
      .from(ads)
      .where(eq(ads.id, tag))
      .limit(1)
    if (!adById) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
    }
    const campaigns = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.adId, adById.id))
      .orderBy(asc(adCampaigns.createdAt))
    return NextResponse.json({ ad: adById, campaigns })
  }

  const campaigns = await db
    .select()
    .from(adCampaigns)
    .where(eq(adCampaigns.adId, ad.id))
    .orderBy(asc(adCampaigns.createdAt))

  return NextResponse.json({ ad, campaigns })
}
