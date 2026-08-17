"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Ad = { id: string; title: string; category: string; description: string | null; price: string | null; dimensions: string | null; mobileDimensions: string | null; channelTag: string | null; platform: string; imageUrl: string | null; sortOrder: number; status: string }
type Campaign = { id: string; adId: string; clientName: string | null; clientContact: string | null; startDate: string | null; durationMonths: number | null; priceAgreed: string | null; bannerUrl: string | null; bannerMobileUrl: string | null; linkUrl: string | null; notes: string | null; status: string }

const categoryOptions = [
  { value: "anasayfa", label: "Anasayfa" },
  { value: "alan", label: "Alan" },
  { value: "altsayfa", label: "Altsayfa" },
  { value: "paragraf", label: "Paragraf" },
  { value: "yan", label: "Yan" },
  { value: "sehir", label: "Şehir Markası" },
  { value: "diger", label: "Diğer" },
]

const dimensionPresets = [
  { label: "Masthead (728x90)", value: "728x90" },
  { label: "Kare (300x250)", value: "300x250" },
  { label: "Dikdörtgen (336x280)", value: "336x280" },
  { label: "Skyscraper (160x600)", value: "160x600" },
  { label: "Geniş (468x60)", value: "468x60" },
  { label: "Mobil (320x100)", value: "320x100" },
]

function monthsSince(date: string): number {
  const d = new Date(date)
  const now = new Date()
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
}

export default function AdminReklamPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [ads, setAds] = useState<Ad[]>([])
  const [campaignsByAd, setCampaignsByAd] = useState<Record<string, Campaign[]>>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")
  const [msgType, setMsgType] = useState<"success" | "error">("success")

  const [editSpot, setEditSpot] = useState<Ad | null>(null)
  const [spotTitle, setSpotTitle] = useState("")
  const [spotCategory, setSpotCategory] = useState("anasayfa")
  const [spotDesc, setSpotDesc] = useState("")
  const [spotPrice, setSpotPrice] = useState("")
  const [spotDims, setSpotDims] = useState("")
  const [spotMobileDims, setSpotMobileDims] = useState("")
  const [spotChannelTag, setSpotChannelTag] = useState("")
  const [spotPlatform, setSpotPlatform] = useState("all")
  const [spotOrder, setSpotOrder] = useState(0)
  const [showSpotForm, setShowSpotForm] = useState(false)

  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [campAdId, setCampAdId] = useState("")
  const [campClient, setCampClient] = useState("")
  const [campContact, setCampContact] = useState("")
  const [campStart, setCampStart] = useState("")
  const [campDuration, setCampDuration] = useState(1)
  const [campPrice, setCampPrice] = useState("")
  const [campBannerUrl, setCampBannerUrl] = useState("")
  const [campBannerMobileUrl, setCampBannerMobileUrl] = useState("")
  const [campLinkUrl, setCampLinkUrl] = useState("")
  const [campNotes, setCampNotes] = useState("")
  const [campUploading, setCampUploading] = useState(false)
  const [showCampForm, setShowCampForm] = useState(false)

  useEffect(() => {
    if (!isPending && (!session || !["editor", "admin"].includes((session.user as any).role))) {
      router.replace("/login")
    }
  }, [session, isPending])

  async function loadData() {
    setLoading(true)
    const res = await fetch("/api/admin/reklam")
    if (res.ok) {
      const data = await res.json()
      setAds(data.ads)
      setCampaignsByAd(data.campaignsByAd)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function showMsg(text: string, type: "success" | "error" = "success") {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(""), 4000)
  }

  function resetSpotForm() {
    setEditSpot(null)
    setSpotTitle("")
    setSpotCategory("anasayfa")
    setSpotDesc("")
    setSpotPrice("")
    setSpotDims("")
    setSpotMobileDims("")
    setSpotChannelTag("")
    setSpotPlatform("all")
    setSpotOrder(0)
  }

  function openSpotForm(ad?: Ad) {
    if (ad) {
      setEditSpot(ad)
      setSpotTitle(ad.title)
      setSpotCategory(ad.category)
      setSpotDesc(ad.description || "")
      setSpotPrice(ad.price || "")
      setSpotDims(ad.dimensions || "")
      setSpotMobileDims(ad.mobileDimensions || "")
      setSpotChannelTag(ad.channelTag || "")
      setSpotPlatform(ad.platform || "all")
      setSpotOrder(ad.sortOrder)
    } else {
      resetSpotForm()
      // yeni spot için kategorideki son sırayı bul
      const catAds = ads.filter(a => a.category === spotCategory)
      const maxOrder = catAds.reduce((max, a) => Math.max(max, a.sortOrder), 0)
      setSpotOrder(maxOrder + 1)
    }
    setShowSpotForm(true)
  }

  async function saveSpot(e: React.FormEvent) {
    e.preventDefault()
    if (!spotTitle) return
    const url = editSpot ? `/api/admin/reklam/${editSpot.id}` : "/api/admin/reklam"
    const method = editSpot ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: spotTitle,
        category: spotCategory,
        description: spotDesc || null,
        price: spotPrice || null,
        dimensions: spotDims || null,
        mobileDimensions: spotMobileDims || null,
        channelTag: spotChannelTag || null,
        platform: spotPlatform,
        sortOrder: spotOrder,
      }),
    })
    if (res.ok) {
      showMsg(editSpot ? "Reklam alanı güncellendi" : "Reklam alanı oluşturuldu")
      setShowSpotForm(false)
      resetSpotForm()
      loadData()
    } else {
      showMsg("Hata: " + ((await res.json()).error || "bilinmeyen hata"), "error")
    }
  }

  async function deleteSpot(ad: Ad) {
    if (!confirm(`"${ad.title}" alanını silmek istediğinize emin misiniz?`)) return
    const res = await fetch(`/api/admin/reklam/${ad.id}`, { method: "DELETE" })
    if (res.ok) {
      showMsg("Reklam alanı silindi")
      loadData()
    } else {
      showMsg("Silme hatası", "error")
    }
  }

  async function toggleSpotStatus(ad: Ad) {
    const res = await fetch(`/api/admin/reklam/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: ad.status === "active" ? "passive" : "active" }),
    })
    if (res.ok) {
      showMsg(ad.status === "active" ? "Yayından kaldırıldı" : "Yayına alındı")
      loadData()
    }
  }

  function resetCampForm() {
    setEditCampaign(null)
    setCampAdId("")
    setCampClient("")
    setCampContact("")
    setCampStart("")
    setCampDuration(1)
    setCampPrice("")
    setCampBannerUrl("")
    setCampBannerMobileUrl("")
    setCampLinkUrl("")
    setCampNotes("")
  }

  function openCampForm(campaign?: Campaign, adId?: string) {
    if (campaign) {
      setEditCampaign(campaign)
      setCampAdId(campaign.adId)
      setCampClient(campaign.clientName || "")
      setCampContact(campaign.clientContact || "")
      setCampStart(campaign.startDate ? campaign.startDate.slice(0, 10) : "")
      setCampDuration(campaign.durationMonths || 1)
      setCampPrice(campaign.priceAgreed || "")
      setCampBannerUrl(campaign.bannerUrl || "")
      setCampBannerMobileUrl(campaign.bannerMobileUrl || "")
      setCampLinkUrl(campaign.linkUrl || "")
      setCampNotes(campaign.notes || "")
    } else {
      resetCampForm()
      setCampAdId(adId || "")
    }
    setShowCampForm(true)
  }

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault()
    if (!campAdId) return
    const url = editCampaign ? `/api/admin/reklam/kampanya/${editCampaign.id}` : "/api/admin/reklam/kampanya"
    const method = editCampaign ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adId: campAdId,
        clientName: campClient || null,
        clientContact: campContact || null,
        startDate: campStart || null,
        durationMonths: campDuration,
        priceAgreed: campPrice || null,
        bannerUrl: campBannerUrl || null,
        bannerMobileUrl: campBannerMobileUrl || null,
        linkUrl: campLinkUrl || null,
        notes: campNotes || null,
      }),
    })
    if (res.ok) {
      showMsg(editCampaign ? "Kampanya güncellendi" : "Kampanya oluşturuldu")
      setShowCampForm(false)
      resetCampForm()
      loadData()
    } else {
      showMsg("Hata: " + ((await res.json()).error || "bilinmeyen hata"), "error")
    }
  }

  async function deleteCampaign(campaign: Campaign) {
    if (!confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return
    const res = await fetch(`/api/admin/reklam/kampanya/${campaign.id}`, { method: "DELETE" })
    if (res.ok) {
      showMsg("Kampanya silindi")
      loadData()
    } else {
      showMsg("Silme hatası", "error")
    }
  }

  async function toggleCampaignStatus(campaign: Campaign) {
    const res = await fetch(`/api/admin/reklam/kampanya/${campaign.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: campaign.status === "active" ? "ended" : "active" }),
    })
    if (res.ok) {
      showMsg(campaign.status === "active" ? "Kampanya sonlandırıldı" : "Kampanya aktifleştirildi")
      loadData()
    }
  }

  if (isPending) return <div className="text-center py-20 text-gray-400">Yükleniyor…</div>

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Reklam Yönetimi</h1>
        <button onClick={() => openSpotForm()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition w-full sm:w-auto text-center">
          + Yeni Reklam Alanı
        </button>
      </div>

      {msg && (
        <div className={`${msgType === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"} border rounded-lg p-3 mb-4 text-sm`}>
          {msg}
        </div>
      )}

      {/* Reklam Alani Formu */}
      {showSpotForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSpotForm(false)}>
          <div className="bg-[#0f0f16] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editSpot ? "Alanı Düzenle" : "Yeni Reklam Alanı"}</h2>
            <form onSubmit={saveSpot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Başlık <span className="text-red-500">*</span></label>
                <input value={spotTitle} onChange={e => setSpotTitle(e.target.value)} required placeholder="Örn: Blok Reklam (Header Altı)"
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Kategori</label>
                  <select value={spotCategory} onChange={e => setSpotCategory(e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sıra</label>
                  <input type="number" value={spotOrder} onChange={e => setSpotOrder(Number(e.target.value))}
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Açıklama</label>
                <textarea value={spotDesc} onChange={e => setSpotDesc(e.target.value)} rows={2} placeholder="Reklam alanının konumu ve açıklaması"
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fiyat</label>
                <input value={spotPrice} onChange={e => setSpotPrice(e.target.value)} placeholder="Örn: 5.000 TL / ay"
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Kanal Etiketi</label>
                  <input value={spotChannelTag} onChange={e => setSpotChannelTag(e.target.value)} placeholder="Örn: ana-1"
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Platform</label>
                  <select value={spotPlatform} onChange={e => setSpotPlatform(e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="all">Hepsi (Mobil / Masaüstü)</option>
                    <option value="desktop">Sadece Masaüstü</option>
                    <option value="mobile">Sadece Mobil</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Masaüstü Boyut</label>
                <div className="flex gap-2">
                  <input value={spotDims} onChange={e => setSpotDims(e.target.value)} placeholder="Örn: 728x90"
                    className="flex-1 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <select onChange={e => { if (e.target.value) setSpotDims(e.target.value) }} value=""
                    className="border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <option value="">Hazır</option>
                    {dimensionPresets.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mobil Boyut</label>
                <input value={spotMobileDims} onChange={e => setSpotMobileDims(e.target.value)} placeholder="Örn: 600"
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
                  {editSpot ? "Güncelle" : "Oluştur"}
                </button>
                <button type="button" onClick={() => { setShowSpotForm(false); resetSpotForm() }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kampanya Formu */}
      {showCampForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCampForm(false)}>
          <div className="bg-[#0f0f16] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editCampaign ? "Kampanyayı Düzenle" : "Yeni Kampanya"}</h2>
            <form onSubmit={saveCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reklam Alanı <span className="text-red-500">*</span></label>
                <select value={campAdId} onChange={e => setCampAdId(e.target.value)} required
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Seçin --</option>
                  {ads.filter(a => a.status === "active").map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Müşteri Adı</label>
                  <input value={campClient} onChange={e => setCampClient(e.target.value)} placeholder="Firma adı"
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">İletişim</label>
                  <input value={campContact} onChange={e => setCampContact(e.target.value)} placeholder="Tel / Email"
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Başlangıç Tarihi</label>
                  <input type="date" value={campStart} onChange={e => setCampStart(e.target.value)}
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Süre (ay)</label>
                  <input type="number" min={1} value={campDuration} onChange={e => setCampDuration(Number(e.target.value))}
                    className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Anlaşılan Fiyat</label>
                <input value={campPrice} onChange={e => setCampPrice(e.target.value)} placeholder="Örn: 4.500 TL"
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Banner Görseli (Masaüstü)</label>
                <div className="flex gap-2">
                  <input value={campBannerUrl} onChange={e => setCampBannerUrl(e.target.value)} placeholder="URL veya yükle"
                    className="flex-1 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <label className="shrink-0 cursor-pointer bg-[#0f0f16] hover:bg-gray-200 text-gray-400 px-3 py-2 rounded-lg text-sm transition">
                    📁
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setCampUploading(true)
                      const fd = new FormData()
                      fd.append("file", file)
                      const res = await fetch("/api/admin/reklam/upload", { method: "POST", body: fd })
                      if (res.ok) {
                        const data = await res.json()
                        setCampBannerUrl(data.url)
                      }
                      setCampUploading(false)
                    }} />
                  </label>
                </div>
                {campUploading && <p className="text-xs text-blue-500 mt-1">Yükleniyor…</p>}
                {campBannerUrl && (
                  <img src={campBannerUrl} alt="Banner önizleme" className="mt-2 max-h-16 rounded border" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Banner Görseli (Mobil)</label>
                <div className="flex gap-2">
                  <input value={campBannerMobileUrl} onChange={e => setCampBannerMobileUrl(e.target.value)} placeholder="URL veya yükle"
                    className="flex-1 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <label className="shrink-0 cursor-pointer bg-[#0f0f16] hover:bg-gray-200 text-gray-400 px-3 py-2 rounded-lg text-sm transition">
                    📁
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setCampUploading(true)
                      const fd = new FormData()
                      fd.append("file", file)
                      const res = await fetch("/api/admin/reklam/upload", { method: "POST", body: fd })
                      if (res.ok) {
                        const data = await res.json()
                        setCampBannerMobileUrl(data.url)
                      }
                      setCampUploading(false)
                    }} />
                  </label>
                </div>
                {campBannerMobileUrl && (
                  <img src={campBannerMobileUrl} alt="Mobil banner önizleme" className="mt-2 max-h-12 rounded border" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Link (tıklanınca gidilecek URL)</label>
                <input value={campLinkUrl} onChange={e => setCampLinkUrl(e.target.value)} placeholder="https://ornek.com"
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notlar</label>
                <textarea value={campNotes} onChange={e => setCampNotes(e.target.value)} rows={2}
                  className="w-full border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
                  {editCampaign ? "Güncelle" : "Oluştur"}
                </button>
                <button type="button" onClick={() => { setShowCampForm(false); resetCampForm() }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <p className="text-gray-400">Yükleniyor…</p>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Henüz reklam alanı eklenmemiş.</p>
          <p className="text-sm mt-1">"+ Yeni Reklam Alanı" butonuna tıklayarak ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(["anasayfa", "alan", "altsayfa", "paragraf", "yan", "sehir", "diger"] as const).map(cat => {
            const items = ads.filter(a => a.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat}>
                <h3 className="font-semibold text-gray-300 mb-2 text-sm uppercase tracking-wide">
                  {categoryOptions.find(o => o.value === cat)?.label} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map(ad => {
                    const campaigns = campaignsByAd[ad.id] || []
                    const isActive = ad.status === "active"
                    return (
                      <div key={ad.id} className={`border rounded-lg p-4 ${isActive ? "bg-[#0f0f16] border-white/5" : "bg-[#050508] border-white/5 opacity-70"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`} />
                            <span className="font-medium text-sm">{ad.title}</span>
                            <span className="text-xs bg-[#0f0f16] text-gray-400 font-mono px-1.5 py-0.5 rounded">#{ad.sortOrder}</span>
                            {ad.channelTag && <span className="text-xs bg-[#0f0f16] text-gray-400 font-mono px-1.5 py-0.5 rounded">{ad.channelTag}</span>}
                            {ad.price && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{ad.price}</span>}
                            {ad.dimensions && <span className="text-xs text-gray-400 font-mono">{ad.dimensions}</span>}
                            {ad.platform !== "all" && <span className="text-xs text-gray-400">{ad.platform === "mobile" ? "📱" : "💻"}</span>}
                            {!isActive && <span className="text-xs bg-gray-200 text-gray-400 px-2 py-0.5 rounded">Pasif</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openCampForm(undefined, ad.id)}
                              className="text-green-600 hover:text-green-700 text-xs font-medium">+ Kampanya</button>
                            <button onClick={() => toggleSpotStatus(ad)}
                              className={`text-xs font-medium ${isActive ? "text-orange-500 hover:text-orange-700" : "text-green-500 hover:text-green-700"}`}>
                              {isActive ? "Pasif Yap" : "Aktif Yap"}
                            </button>
                            <button onClick={() => openSpotForm(ad)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium">Düzenle</button>
                            <button onClick={() => deleteSpot(ad)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium">Sil</button>
                          </div>
                        </div>
                        {ad.description && <p className="text-xs text-gray-400 mt-1">{ad.description}</p>}

                        {campaigns.length > 0 && (
                          <div className="mt-3 border-t border-gray-50 pt-2 space-y-1">
                            {campaigns.map(c => {
                              const months = c.startDate ? monthsSince(c.startDate) : 0
                              const remaining = c.durationMonths ? c.durationMonths - months : 0
                              const campActive = c.status === "active"
                              return (
                                <div key={c.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs rounded px-3 py-2 ${campActive ? "bg-[#050508]" : "bg-[#0f0f16] opacity-60"}`}>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`w-1.5 h-1.5 rounded-full ${campActive ? "bg-green-500" : "bg-gray-400"}`} />
                                    <span className="font-medium text-gray-300">{c.clientName || "İsimsiz"}</span>
                                    {c.startDate && (
                                      <span className="text-gray-400">
                                        {new Date(c.startDate).toLocaleDateString("tr-TR")}
                                        {" — "}Ay {months + 1}/{c.durationMonths || "?"}
                                        {remaining <= 0 && c.durationMonths
                                          ? <span className="text-red-500 font-medium ml-1">(bitti)</span>
                                          : remaining <= 1
                                          ? <span className="text-yellow-500 font-medium ml-1">(son Ay)</span>
                                          : <span className="text-green-500 font-medium ml-1">({remaining} ay)</span>
                                        }
                                      </span>
                                    )}
                                    {c.priceAgreed && <span className="font-mono text-gray-400">{c.priceAgreed}</span>}
                                    {c.clientContact && <span className="text-gray-400">{c.clientContact}</span>}
                                    {c.bannerUrl && <span className="text-green-500 font-medium">🖼️ Banner var</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => toggleCampaignStatus(c)}
                                      className={`text-xs font-medium ${campActive ? "text-orange-500" : "text-green-500"}`}>
                                      {campActive ? "Sonlandır" : "Aktifleştir"}
                                    </button>
                                    <button onClick={() => openCampForm(c)}
                                      className="text-blue-500 hover:text-blue-700 text-xs">Düzenle</button>
                                    <button onClick={() => deleteCampaign(c)}
                                      className="text-red-500 hover:text-red-700 text-xs">Sil</button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
