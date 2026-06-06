"use client"

import { useEffect, useState } from "react"

type Comment = {
  id: string
  html: string
  status: string
  createdAt: string
  member: { id: string; name: string; email: string } | null
  post: { id: string; title: string; slug: string } | null
}

export default function CommentsPage() {
  const [data, setData] = useState<{ total: number; comments: Comment[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState("")

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/comments")
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    setMsg("")
    const res = await fetch("/api/admin/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setMsg("✅ Güncellendi")
      load()
    } else {
      const d = await res.json()
      setMsg("❌ " + (d.error || "Hata"))
    }
  }

  async function deleteComment(id: string) {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return
    setMsg("")
    const res = await fetch("/api/admin/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setMsg("✅ Silindi")
      load()
    } else {
      const d = await res.json()
      setMsg("❌ " + (d.error || "Hata"))
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Yükleniyor…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">💬 Yorumlar</h1>
      <p className="text-sm text-gray-500 mb-6">Toplam {data?.total || 0} yorum</p>

      {msg && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-100">
          {msg}
        </div>
      )}

      <div className="space-y-3">
        {data?.comments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Henüz yorum yok</div>
        ) : data?.comments.map(c => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  {c.member?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.member?.name || "Anonim"}</p>
                  <p className="text-xs text-gray-400">{c.member?.email || ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {c.status}
                </span>
                {c.post && (
                  <a href={`/haberler/${c.post.slug}`} target="_blank" className="text-xs text-blue-500 hover:underline">
                    #{c.post.slug}
                  </a>
                )}
              </div>
            </div>

            <div
              className="text-sm text-gray-700 prose prose-sm max-w-none mb-3"
              dangerouslySetInnerHTML={{ __html: c.html || "" }}
            />

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">{new Date(c.createdAt).toLocaleString("tr-TR")}</span>
              <span className="text-gray-300">·</span>
              {c.status === "published" ? (
                <button onClick={() => updateStatus(c.id, "hidden")} className="text-yellow-600 hover:text-yellow-700 font-medium">
                  Gizle
                </button>
              ) : (
                <button onClick={() => updateStatus(c.id, "published")} className="text-green-600 hover:text-green-700 font-medium">
                  Yayınla
                </button>
              )}
              <button onClick={() => deleteComment(c.id)} className="text-red-500 hover:text-red-600 font-medium">
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
