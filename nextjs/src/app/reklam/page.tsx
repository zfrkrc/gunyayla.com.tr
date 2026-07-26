import { db, ads, adCampaigns } from "@/lib/db"
import { eq, asc } from "drizzle-orm"
import Link from "next/link"

export const dynamic = "force-dynamic"

const categoryLabels: Record<string, string> = {
  anasayfa: "Anasayfa Reklamları",
  alan: "Alan Reklamları",
  altsayfa: "Altsayfa Reklamları",
  paragraf: "Paragraf Reklamları",
  yan: "Yan Reklamlar",
  sehir: "Şehir Markası",
  diger: "Diğer Reklamlar",
}

export default async function ReklamPage() {
  const allAds = await db
    .select()
    .from(ads)
    .where(eq(ads.status, "active"))
    .orderBy(asc(ads.sortOrder), asc(ads.createdAt))

  const allCampaigns = await db
    .select()
    .from(adCampaigns)
    .where(eq(adCampaigns.status, "active"))

  const activeAdIds = new Set(allCampaigns.map(c => c.adId))

  const grouped: Record<string, typeof allAds> = {}
  for (const ad of allAds) {
    const key = ad.category || "diger"
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(ad)
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Reklam</h1>
        <p className="text-gray-500 text-sm md:text-base">
          GünYayla.com.tr reklam seçenekleri ve fiyat bilgileri
        </p>
      </div>

      {/* Iletisim kutusu */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 md:p-8 mb-10 text-white text-center md:text-left">
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold mb-1">Reklam vermek için iletişim</p>
            <p className="text-blue-100 text-sm">
              Size özel reklam paketleri ve kampanya fırsatları için bize ulaşın.
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:text-right space-y-1">
            <a href="tel:+905529512629" className="block text-xl font-bold hover:text-blue-200 transition">
              +90 (552) 951 26 29
            </a>
            <a href="mailto:info@gunyayla.com.tr" className="block text-sm text-blue-100 underline hover:text-white transition">
              info@gunyayla.com.tr
            </a>
          </div>
        </div>
      </div>

      {/* Icerik */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📢</div>
          <p className="text-gray-400 text-lg">Henüz reklam seçeneği eklenmemiş.</p>
          <p className="text-gray-400 text-sm mt-1">Reklam vermek için yukarıdaki iletişim bilgilerinden bize ulaşabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full inline-block" />
                {categoryLabels[cat] || cat}
                <span className="text-sm font-normal text-gray-400">({items.length} seçenek)</span>
              </h2>
              <div className="grid gap-4">
                {items.map((ad) => {
                  const hasActiveCampaign = activeAdIds.has(ad.id)
                  return (
                    <Link key={ad.id} href={`/reklam/${ad.channelTag || ad.id}`} className="block group">
                      <div className="bg-white border border-gray-100 rounded-xl p-5 md:p-6 hover:shadow-lg hover:border-blue-100 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-sm md:text-base group-hover:text-blue-600 transition-colors">
                                {ad.title}
                              </h3>
                              {hasActiveCampaign && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                                  Yayında
                                </span>
                              )}
                              <span className="text-xs text-blue-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                → İncele
                              </span>
                            </div>
                            {ad.description && (
                              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{ad.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {ad.channelTag && (
                                <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                                  {ad.channelTag}
                                </span>
                              )}
                              {ad.dimensions && (
                                <span className="text-xs text-gray-400 font-mono">
                                  {ad.dimensions}
                                </span>
                              )}
                              {ad.price && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                                  {ad.price}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {ad.price ? (
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 font-bold text-sm px-5 py-3 rounded-xl text-center min-w-[100px]">
                                {ad.price}
                              </div>
                            ) : (
                              <div className="bg-gray-50 text-gray-400 text-xs px-5 py-3 rounded-xl text-center min-w-[100px]">
                                Bilgi alın
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Alt iletişim */}
      <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8 text-center">
        <p className="text-gray-600 text-sm md:text-base mb-4">
          Reklam vermek, ortak çalışma ve kampanya fırsatları için bizimle iletişime geçin.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:+905529512629"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition w-full sm:w-auto text-center"
          >
            +90 (552) 951 26 29
          </a>
          <a
            href="mailto:info@gunyayla.com.tr"
            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition w-full sm:w-auto text-center"
          >
            info@gunyayla.com.tr
          </a>
        </div>
      </div>
    </div>
  )
}
