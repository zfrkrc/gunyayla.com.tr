import { db, ads, adCampaigns } from "@/lib/db"
import { eq, and, asc, inArray } from "drizzle-orm"

type Props = {
  category: string
  className?: string
}

export async function AdDisplay({ category, className = "" }: Props) {
  const activeAds = await db
    .select()
    .from(ads)
    .where(and(eq(ads.category, category), eq(ads.status, "active")))
    .orderBy(asc(ads.sortOrder))

  if (activeAds.length === 0) return null

  const adIds = activeAds.map(a => a.id)
  const campaigns = await db
    .select()
    .from(adCampaigns)
    .where(and(
      eq(adCampaigns.status, "active"),
      inArray(adCampaigns.adId, adIds),
    ))
    .orderBy(asc(adCampaigns.createdAt))

  if (campaigns.length === 0) return null

  return (
    <div className={`ad-container space-y-3 ${className}`}>
      {campaigns.map(c => {
        const imgUrl = c.bannerUrl || c.bannerMobileUrl
        if (!imgUrl) return null
        const img = (
          <img
            src={imgUrl}
            alt={c.clientName || "Reklam"}
            className="w-full h-auto max-w-full"
            style={{ minHeight: category === "yan" ? 100 : 60 }}
            loading="lazy"
          />
        )
        return (
          <div key={c.id} className="ad-banner">
            {c.linkUrl ? (
              <a href={c.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
                {img}
              </a>
            ) : (
              img
            )}
          </div>
        )
      })}
    </div>
  )
}
