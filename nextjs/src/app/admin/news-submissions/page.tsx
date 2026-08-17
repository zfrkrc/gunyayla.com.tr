"use client"

import { useEffect, useState } from "react"

type Submission = {
  id: string
  name: string
  email: string | null
  phone: string | null
  title: string
  content: string
  status: string
  created_at: string
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: "Bekliyor", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  approved: { label: "Onaylandı", cls: "bg-green-600/15 text-green-500 border-green-600/30" },
  rejected: { label: "Reddedildi", cls: "bg-red-600/15 text-red-500 border-red-600/30" },
}

export default function NewsSubmissionsPage() {
  const [data, setData] = useState<{ total: number; submissions: Submission[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/news-submissions")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/news-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  if (loading) return <div className="text-center py-10 text-gray-400">Yükleniyor…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">📨 Haber Başvuruları</h1>
      <p className="text-sm text-gray-400 mb-6">Toplam {data?.total || 0} başvuru</p>

      <div className="space-y-3">
        {data?.submissions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Henüz başvuru yok</div>
        ) : data?.submissions.map(s => (
          <div key={s.id} className="bg-[#0f0f16] border border-white/5 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#050508]/50 transition"
            >
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${statusLabels[s.status]?.cls || ""}`}>
                {statusLabels[s.status]?.label || s.status}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-100 truncate">{s.title}</p>
                <p className="text-xs text-gray-400">{s.name} · {new Date(s.created_at).toLocaleDateString("tr-TR")}</p>
              </div>
              <span className="text-gray-400 text-xs">{expanded === s.id ? "−" : "+"}</span>
            </button>

            {expanded === s.id && (
              <div className="px-4 pb-4 border-t border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-3 mb-3">
                  <div><span className="text-gray-400 text-xs block">E-posta</span><span className="text-gray-200">{s.email || "—"}</span></div>
                  <div><span className="text-gray-400 text-xs block">Telefon</span><span className="text-gray-200">{s.phone || "—"}</span></div>
                  <div><span className="text-gray-400 text-xs block">Tarih</span><span className="text-gray-200">{new Date(s.created_at).toLocaleString("tr-TR")}</span></div>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">{s.content}</p>
                <div className="flex gap-2">
                  {s.status !== "approved" && (
                    <button onClick={() => setStatus(s.id, "approved")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600/15 text-green-500 border border-green-600/30 hover:bg-green-600/25 transition">
                      ✓ Onayla
                    </button>
                  )}
                  {s.status !== "rejected" && (
                    <button onClick={() => setStatus(s.id, "rejected")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/15 text-red-500 border border-red-600/30 hover:bg-red-600/25 transition">
                      ✕ Reddet
                    </button>
                  )}
                  {s.status !== "pending" && (
                    <button onClick={() => setStatus(s.id, "pending")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition">
                      Beklemeye Al
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
