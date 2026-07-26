"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"

type Album = { id: string; title: string; slug: string; description: string | null; coverImage: string | null }
type Photo = { id: string; albumId: string; filename: string; url: string; caption: string | null }

export default function EditorPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [albums, setAlbums]          = useState<Album[]>([])
  const [tab, setTab]                = useState<"albums" | "upload">("albums")
  const [selectedAlbum, setSelectedAlbum] = useState<string>("")
  const [files, setFiles]            = useState<FileList | null>(null)
  const [caption, setCaption]        = useState("")
  const [uploading, setUploading]    = useState(false)
  const [msg, setMsg]                = useState("")
  const [photos, setPhotos]          = useState<Photo[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [deleting, setDeleting]      = useState<string | null>(null)

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

  function loadAlbums() {
    fetch("/api/gallery").then(r => r.json()).then(setAlbums)
  }
  useEffect(loadAlbums, [])

  // Albüm seçilince fotoğrafları getir
  useEffect(() => {
    if (!selectedAlbum) { setPhotos([]); return }
    setLoadingPhotos(true)
    const album = albums.find(a => a.id === selectedAlbum)
    if (!album) { setLoadingPhotos(false); return }
    fetch(`/api/gallery/${album.slug}`)
      .then(r => r.json())
      .then(data => setPhotos(data.photos || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoadingPhotos(false))
  }, [selectedAlbum, albums])

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
      setMsg("Albüm oluşturuldu")
    } else {
      setMsg("Hata: " + (await res.json()).error)
    }
  }

  async function deleteAlbum(album: Album) {
    if (!confirm(`"${album.title}" albümünü ve içindeki tüm fotoğrafları silmek istediğinize emin misiniz?`)) return
    const res = await fetch(`/api/gallery/${album.slug}`, { method: "DELETE" })
    if (res.ok) {
      setAlbums(a => a.filter(x => x.id !== album.id))
      if (selectedAlbum === album.id) { setSelectedAlbum(""); setPhotos([]) }
      setMsg("Albüm silindi")
    } else {
      setMsg("Silme hatası: " + ((await res.json()).error || "bilinmeyen hata"))
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
      setMsg(`${data.uploaded.length} fotoğraf yüklendi`)
      setFiles(null)
      if (fileRef.current) fileRef.current.value = ""
      // Fotoğrafları yenile
      const album = albums.find(a => a.id === selectedAlbum)
      if (album) {
        const r = await fetch(`/api/gallery/${album.slug}`)
        const d = await r.json()
        setPhotos(d.photos || [])
      }
    } else {
      setMsg("Yükleme hatası")
    }
    setUploading(false)
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return
    setDeleting(photo.id)
    const res = await fetch(`/api/upload/${photo.id}`, { method: "DELETE" })
    if (res.ok) {
      setPhotos(p => p.filter(x => x.id !== photo.id))
      setMsg("Fotoğraf silindi")
    } else {
      setMsg("Silme hatası: " + ((await res.json()).error || "bilinmeyen hata"))
    }
    setDeleting(null)
  }

  if (isPending) return <div className="text-center py-20 text-gray-400">Yükleniyor…</div>

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Editör Paneli</h1>

      {/* Haberler Ghost'ta */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
        Haber girmek icin:{" "}
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
                <div className="flex items-center gap-3">
                  <a href={`/galeri/${a.slug}`} target="_blank" className="text-blue-500 hover:underline text-xs">Görüntüle →</a>
                  <button onClick={() => deleteAlbum(a)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fotoğraf yükle ve yönet */}
      {tab === "upload" && (
        <div className="space-y-6">
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

          {/* Mevcut fotoğraflar */}
          {selectedAlbum && (
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="font-semibold text-gray-700 mb-3">
                Albüm Fotoğrafları {loadingPhotos && <span className="text-gray-400 text-xs">(yükleniyor…)</span>}
              </h2>
              {loadingPhotos ? (
                <p className="text-sm text-gray-400">Yükleniyor…</p>
              ) : photos.length === 0 ? (
                <p className="text-sm text-gray-400">Bu albümde henüz fotoğraf yok.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map(p => (
                    <div key={p.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                      <img src={p.url} alt={p.caption || ""}
                        className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button onClick={() => deletePhoto(p)} disabled={deleting === p.id}
                          className="bg-red-500 text-white text-xs px-3 py-1 rounded-md hover:bg-red-600 disabled:opacity-50">
                          {deleting === p.id ? "…" : "Sil"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
