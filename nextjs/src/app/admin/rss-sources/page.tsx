"use client"

import { useEffect, useState } from "react"

type Source = { name: string; url: string }

export default function RssSourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [msg, setMsg] = useState("")
  const [restarting, setRestarting] = useState(false)

  async function restartBot() {
    setRestarting(true)
    setMsg("")
    try {
      const res = await fetch("/api/admin/rss-bot/restart", { method: "POST" })
      if (res.ok) setMsg("✅ Bot yeniden başlatılıyor...")
      else setMsg("❌ Hata oluştu")
    } catch {
      setMsg("❌ Bağlantı hatası")
    }
    setRestarting(false)
  }

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/rss-sources")
    if (res.ok) setSources(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addSource(e: React.FormEvent) {
    e.preventDefault()
    setMsg("")
    const res = await fetch("/api/admin/rss-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    })
    if (res.ok) {
      const data = await res.json()
      setSources(data.sources)
      setName("")
      setUrl("")
      setMsg("✅ Kaynak eklendi")
    } else {
      const data = await res.json()
      setMsg("❌ " + (data.error || "Hata"))
    }
  }

  async function deleteSource(index: number) {
    if (!confirm("Bu kaynağı silmek istediğinize emin misiniz?")) return
    setMsg("")
    const res = await fetch("/api/admin/rss-sources", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    })
    if (res.ok) {
      const data = await res.json()
      setSources(data.sources)
      setMsg("✅ Kaynak silindi")
    } else {
      const data = await res.json()
      setMsg("❌ " + (data.error || "Hata"))
    }
  }

  function startEdit(idx: number) {
    setEditIdx(idx)
    setEditName(sources[idx].name)
    setEditUrl(sources[idx].url)
  }

  async function saveEdit() {
    if (editIdx === null) return
    setMsg("")
    const res = await fetch("/api/admin/rss-sources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: editIdx, name: editName, url: editUrl }),
    })
    if (res.ok) {
      const data = await res.json()
      setSources(data.sources)
      setEditIdx(null)
      setMsg("✅ Kaynak güncellendi")
    } else {
      const data = await res.json()
      setMsg("❌ " + (data.error || "Hata"))
    }
  }

  function cancelEdit() {
    setEditIdx(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📡 RSS Kaynakları</h1>

      {msg && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-100">
          {msg}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Yeni Kaynak Ekle</h2>
        <form onSubmit={addSource} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Site Adı</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="Örn: Yozgat Çamlık"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-medium text-gray-500 mb-1">RSS URL</label>
            <input value={url} onChange={e => setUrl(e.target.value)} required
              placeholder="https://www.yozgatcamlik.com/rss/"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <button type="submit" className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap">
            Ekle
          </button>
        </form>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={restartBot} disabled={restarting}
          className="bg-green-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
          {restarting ? "Yeniden başlatılıyor..." : "🔄 Botu Yeniden Başlat"}
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Site Adı</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">RSS URL</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Yükleniyor…</td></tr>
            ) : sources.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Henüz kaynak eklenmemiş.</td></tr>
            ) : sources.map((s, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                {editIdx === i ? (
                  <>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={editUrl} onChange={e => setEditUrl(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-700 text-xs font-medium mr-3">Kaydet</button>
                      <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 text-xs">İptal</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[400px]">{s.url}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(i)} className="text-blue-600 hover:text-blue-700 text-xs font-medium mr-3">Düzenle</button>
                      <button onClick={() => deleteSource(i)} className="text-red-500 hover:text-red-600 text-xs font-medium">Sil</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
