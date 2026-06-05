"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"

type Album = { id: string; title: string; slug: string; description: string | null; coverImage: string | null }

export default function EditorPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [albums, setAlbums]       = useState<Album[]>([])
  const [tab, setTab]             = useState<"albums" | "upload">("albums")
  const [selectedAlbum, setSelectedAlbum] = useState<string>("")
  const [files, setFiles]         = useState<FileList | null>(null)
  const [caption, setCaption]     = useState("")
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg]             = useState("")

  // Yeni albüm formu
  const [newTitle, setNewTitle]   = useState("")
  const [newSlug, setNewSlug]     = useState("")
  const [newDesc, setNewDesc]     = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isPending && (!session || !["editor", "admin"].includes((session.user as any).role))) {
      router.replace("/login")
    }
  }, [session, isPending])

  useEffect(() => {
    fetch("/api/gallery").then(r => r.json()).then(setAlbums)
  }, [])

  async function createAlbum(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, slug: newSlug, description: newDesc }),
    })
    if (res.ok) {
      const album = await res.json()
      setAlbums(a => [album, ...a])
      setNewTitle(""); setNewSlug(""); setNewDesc("")
      setMsg("✅ Albüm oluşturuldu")
    } else {
      setMsg("❌ Hata: " + (await res.json()).error)
    }
  }

  async function uploadPhotos(e: React.FormEvent) {
    e.preventDefault()
    if (!files || !selectedAlbum) return
    setUploading(true)
    setMsg("")

    const fd = new FormData()
    fd.append("albumId", selectedAlbum)
    if (caption) fd.append("caption", caption)
    Array.from(files).forEach(f => fd.append("files", f))

    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (res.ok) {
      const data = await res.json()
      setMsg(`✅ ${data.uploaded.length} fotoğraf yüklendi`)
      setFiles(null)
      if (fileRef.current) fileRef.current.value = ""
    } else {
      setMsg("❌ Yükleme hatası")
    }
    setUploading(false)
  }

  if (isPending) return <div className="text-center py-20 text-gray-400">Yükleniyor…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editör Paneli</h1>

      {/* Haberler Ghost'ta */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
        📝 Haber girmek için:{" "}
        <a href="/ghost" target="_blank" className="underline font-medium">Ghost Admin Paneli →</a>
      </div>

      {/* Tab */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
        {([["albums", "Albüm Oluştur"], ["upload", "Fotoğraf Yükle"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition ${tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm mb-4 text-center">{msg}</p>}

      {/* Albüm oluştur */}
      {tab === "albums" && (
        <div>
          <form onSubmit={createAlbum} className="bg-white border border-gray-100 rounded-xl p-6 space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Albüm Adı</label>
              <input value={newTitle} onChange={e => { setNewTitle(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) }}
                required className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input value={newSlug} onChange={e => setNewSlug(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (opsiyonel)</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
              Albüm Oluştur
            </button>
          </form>

          {/* Mevcut albümler */}
          <h2 className="font-semibold text-gray-700 mb-3">Mevcut Albümler ({albums.length})</h2>
          <div className="space-y-2">
            {albums.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-3 text-sm">
                <span className="font-medium">{a.title}</span>
                <a href={`/galeri/${a.slug}`} target="_blank" className="text-blue-500 hover:underline text-xs">Görüntüle →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fotoğraf yükle */}
      {tab === "upload" && (
        <form onSubmit={uploadPhotos} className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Albüm Seç</label>
            <select value={selectedAlbum} onChange={e => setSelectedAlbum(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="">-- Albüm seçin --</option>
              {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fotoğraflar</label>
            <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => setFiles(e.target.files)} required
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100" />
            <p className="text-xs text-gray-400 mt-1">Birden fazla seçebilirsiniz. Maks 10MB / fotoğraf.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (hepsi için)</label>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="opsiyonel"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button type="submit" disabled={uploading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
            {uploading ? "Yükleniyor…" : "Fotoğrafları Yükle"}
          </button>
        </form>
      )}
    </div>
  )
}
