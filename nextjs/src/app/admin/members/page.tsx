"use client"

import { useEffect, useState } from "react"

type Member = {
  id: string
  name: string
  email: string
  status: string
  createdAt: string
  lastSeen: string | null
  note: string | null
}

export default function MembersPage() {
  const [data, setData] = useState<{ total: number; members: Member[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/members")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-10 text-gray-400">Yükleniyor…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">👥 Üyeler</h1>
      <p className="text-sm text-gray-400 mb-6">Toplam {data?.total || 0} üye</p>

      <div className="bg-[#0f0f16] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#050508] border-b border-white/5">
              <th className="text-left px-4 py-3 font-medium text-gray-400">Ad</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">E-posta</th>
              <th className="text-center px-4 py-3 font-medium text-gray-400">Durum</th>
              <th className="text-center px-4 py-3 font-medium text-gray-400">Kayıt</th>
              <th className="text-center px-4 py-3 font-medium text-gray-400">Son Görülme</th>
            </tr>
          </thead>
          <tbody>
            {data?.members.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Henüz üye yok</td></tr>
            ) : data?.members.map(m => (
              <tr key={m.id} className="border-b border-gray-50 hover:bg-[#050508]/50">
                <td className="px-4 py-3 font-medium text-gray-100">{m.name}</td>
                <td className="px-4 py-3 text-gray-400">{m.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${m.status === "free" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-400">
                  {m.lastSeen ? new Date(m.lastSeen).toLocaleDateString("tr-TR") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.members.some(m => m.note) && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-300 mb-3">Notlar</h2>
          {data.members.filter(m => m.note).map(m => (
            <details key={m.id} className="bg-[#0f0f16] border border-white/5 rounded-lg px-4 py-3 mb-2">
              <summary className="text-sm font-medium text-gray-300 cursor-pointer">{m.name}</summary>
              <pre className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">{m.note}</pre>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
