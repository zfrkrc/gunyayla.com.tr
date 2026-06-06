"use client"

import { useEffect, useState } from "react"

type FeedbackPost = {
  id: string
  title: string
  slug: string
  published_at: string
  image: string | null
  positiveCount: number
  negativeCount: number
  feedbackCount: number
}

export default function FeedbackPage() {
  const [data, setData] = useState<{ total: number; posts: FeedbackPost[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-10 text-gray-400">Yükleniyor…</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">👍 Beğeni İstatistikleri</h1>
      <p className="text-sm text-gray-500 mb-6">Toplam {data?.total || 0} beğeni</p>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Haber</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">👍</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">👎</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {data?.posts.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Henüz beğeni yok</td></tr>
            ) : data?.posts.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image && (
                      <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{p.title}</p>
                      <p className="text-xs text-gray-400">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                    👍 {p.positiveCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 text-red-500 font-bold">
                    👎 {p.negativeCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-400 text-xs">
                  {new Date(p.published_at).toLocaleDateString("tr-TR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
