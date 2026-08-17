import { db, ads, adCampaigns } from "@/lib/db"
import { eq, asc } from "drizzle-orm"
import { notFound } from "next/navigation"
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

const categoryColors: Record<string, string> = {
  anasayfa: "bg-blue-100 text-blue-700",
  alan: "bg-purple-100 text-purple-700",
  altsayfa: "bg-green-100 text-green-700",
  paragraf: "bg-orange-100 text-orange-700",
  yan: "bg-pink-100 text-pink-700",
  sehir: "bg-amber-100 text-amber-700",
  diger: "bg-[#0f0f16] text-gray-300",
}

function pagePreviewSvg(ad: any): string {
  const isHomepage = ad.category === "anasayfa" || ad.category === "sehir"
  const isSidebar = ad.category === "yan"
  const isAlt = ad.category === "altsayfa" || ad.category === "paragraf"

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" class="w-full h-auto">
  <rect width="600" height="500" fill="#f8fafc" rx="8"/>
  ${isHomepage ? `
    <rect x="20" y="15" width="560" height="50" fill="#e2e8f0" rx="6"/>
    <text x="300" y="45" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">MENÜ</text>
    <rect x="20" y="75" width="560" height="80" fill="#dbeafe" rx="6" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="300" y="110" text-anchor="middle" fill="#3b82f6" font-size="13" font-weight="bold" font-family="sans-serif">${ad.title}</text>
    <text x="300" y="130" text-anchor="middle" fill="#3b82f6" font-size="11" font-family="monospace">${ad.dimensions || "970x90"}</text>
    <rect x="20" y="165" width="560" height="30" fill="#e2e8f0" rx="4"/>
    <text x="300" y="185" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">SÜRMANŞET</text>
    <rect x="20" y="205" width="360" height="180" fill="#f1f5f9" rx="6"/>
    <rect x="20" y="205" width="360" height="180" fill="#dbeafe" opacity="0.3" rx="6"/>
    <text x="200" y="295" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">ANA İÇERİK</text>
    <rect x="400" y="205" width="180" height="180" fill="#e2e8f0" rx="6"/>
    <text x="490" y="295" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">SİDEBAR</text>
    <rect x="20" y="395" width="560" height="50" fill="#e2e8f0" rx="6"/>
    <text x="300" y="422" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">FOOTER</text>
  ` : isSidebar ? `
    <rect x="20" y="15" width="560" height="50" fill="#e2e8f0" rx="6"/>
    <text x="300" y="45" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">MENÜ</text>
    <rect x="20" y="75" width="400" height="350" fill="#f1f5f9" rx="6"/>
    <text x="220" y="250" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">SAYFA İÇERİĞİ</text>
    <rect x="440" y="75" width="140" height="200" fill="#dbeafe" rx="6" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="510" y="160" text-anchor="middle" fill="#3b82f6" font-size="12" font-weight="bold" font-family="sans-serif">${ad.title}</text>
    <text x="510" y="180" text-anchor="middle" fill="#3b82f6" font-size="11" font-family="monospace">${ad.dimensions || "300x250"}</text>
    <rect x="440" y="285" width="140" height="140" fill="#e2e8f0" rx="6"/>
    <text x="510" y="355" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="monospace">ALT ALAN</text>
    <rect x="20" y="435" width="560" height="50" fill="#e2e8f0" rx="6"/>
    <text x="300" y="462" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">FOOTER</text>
  ` : `
    <rect x="20" y="15" width="560" height="50" fill="#e2e8f0" rx="6"/>
    <text x="300" y="45" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="monospace">MENÜ</text>
    <rect x="20" y="75" width="400" height="100" fill="#f1f5f9" rx="6"/>
    <text x="220" y="125" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">İÇERİK</text>
    <rect x="20" y="185" width="560" height="70" fill="#dbeafe" rx="6" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,3"/>
    <text x="300" y="215" text-anchor="middle" fill="#3b82f6" font-size="13" font-weight="bold" font-family="sans-serif">${ad.title}</text>
    <text x="300" y="235" text-anchor="middle" fill="#3b82f6" font-size="11" font-family="monospace">${ad.dimensions || "728x90"}</text>
    <rect x="20" y="265" width="400" height="120" fill="#f1f5f9" rx="6"/>
    <text x="220" y="325" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">İÇERİK DEVAMI</text>
    <rect x="440" y="75" width="140" height="310" fill="#e2e8f0" rx="6"/>
    <text x="510" y="230" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">SİDEBAR</text>
    <rect x="20" y="395" width="560" height="50" fill="#e2e8f0" rx="6"/>
    <text x="300" y="422" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="monospace">FOOTER</text>
  `}
</svg>`
}

export default async function ReklamDetailPage(props: { params: Promise<{ tag: string }> }) {
  const { tag } = await props.params

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
    if (!adById) notFound()
    return renderDetail(adById, tag)
  }

  return renderDetail(ad, tag)
}

async function renderDetail(ad: any, tag: string) {
  const campaigns = await db
    .select()
    .from(adCampaigns)
    .where(eq(adCampaigns.adId, ad.id))
    .orderBy(asc(adCampaigns.createdAt))

  const activeCampaign = campaigns.find(c => c.status === "active")
  const catLabel = categoryLabels[ad.category] || ad.category
  const catColor = categoryColors[ad.category] || "bg-[#0f0f16] text-gray-300"
  const svg = pagePreviewSvg(ad)

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-blue-600 transition">Ana Sayfa</Link>
        <span>/</span>
        <Link href="/reklam" className="hover:text-blue-600 transition">Reklam</Link>
        <span>/</span>
        <span className="text-gray-400">{ad.title}</span>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Sol: Görsel yerleşim */}
        <div className="md:col-span-3">
          <div className="bg-[#0f0f16] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-4">YERLEŞİM PLANI</h2>
            <div className="bg-[#050508] rounded-xl p-4" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="text-xs text-gray-400 mt-3 text-center">
              Mavi ile işaretli alan reklamın sayfadaki konumunu göstermektedir.
            </p>
          </div>
        </div>

        {/* Sağ: Detaylar */}
        <div className="md:col-span-2">
          <div className="bg-[#0f0f16] border border-white/5 rounded-2xl p-6 space-y-6">
            <div>
              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${catColor} mb-3`}>
                {catLabel}
              </span>
              <h1 className="text-xl font-bold text-gray-100">{ad.title}</h1>
              {ad.description && (
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">{ad.description}</p>
              )}
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Reklam Grubu</span>
                <span className="font-medium text-gray-100">{catLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Platform</span>
                <span className="font-medium text-gray-100">
                  {ad.platform === "mobile" ? "Mobil" : ad.platform === "desktop" ? "Masaüstü" : "Hepsi (Mobil / Masaüstü)"}
                </span>
              </div>
              {ad.channelTag && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Kanal Etiketi</span>
                  <span className="font-mono font-medium text-gray-100 bg-[#050508] px-2 py-0.5 rounded text-xs">
                    {ad.channelTag}
                  </span>
                </div>
              )}
              {activeCampaign && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Durum</span>
                  <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-0.5 rounded-full">
                    Yayında
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">ÖLÇÜLER (En/Boy)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#050508] rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Masaüstü</p>
                  <p className="text-lg font-bold text-gray-100 font-mono">
                    {ad.dimensions || ad.dimensions || "-"}
                  </p>
                </div>
                <div className="bg-[#050508] rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Mobil</p>
                  <p className="text-lg font-bold text-gray-100 font-mono">
                    {ad.mobileDimensions || "600"}
                  </p>
                </div>
              </div>
            </div>

            {ad.price && (
              <div className="border-t border-white/5 pt-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-blue-500 mb-1">FİYAT</p>
                  <p className="text-2xl font-bold text-blue-700">{ad.price}</p>
                </div>
              </div>
            )}

            <div className="border-t border-white/5 pt-4">
              <Link
                href={`mailto:info@gunyayla.com.tr?subject=${encodeURIComponent("Reklam Talebi: " + ad.title)}`}
                className="block w-full bg-blue-600 text-white text-center rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 transition"
              >
                Bu Alan İçin Teklif Al
              </Link>
              <a
                href="tel:+905529512629"
                className="block w-full bg-[#0f0f16] border border-white/10 text-center rounded-xl py-3 text-sm font-semibold text-gray-300 hover:bg-[#050508] transition mt-2"
              >
                +90 (552) 951 26 29
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Alt yönlendirme */}
      <div className="mt-10 mb-16 text-center">
        <Link href="/reklam" className="text-blue-600 hover:underline text-sm">
          ← Tüm Reklam Seçeneklerine Dön
        </Link>
      </div>
    </div>
  )
}
