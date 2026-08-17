import Link from "next/link"

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yönetim Paneli</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/rss-sources" className="block bg-[#0f0f16] border border-white/5 rounded-xl p-6 hover:shadow-md transition">
          <div className="text-3xl mb-3">📡</div>
          <h2 className="font-semibold text-gray-100 mb-1">RSS Kaynakları</h2>
          <p className="text-sm text-gray-400">RSS kaynaklarını ekle, düzenle, sil. Botun hangi sitelerden haber çekeceğini belirle.</p>
        </Link>
        <a href="/ghost" target="_blank" className="block bg-[#0f0f16] border border-white/5 rounded-xl p-6 hover:shadow-md transition">
          <div className="text-3xl mb-3">✏️</div>
          <h2 className="font-semibold text-gray-100 mb-1">Ghost Admin</h2>
          <p className="text-sm text-gray-400">Haberleri doğrudan Ghost panelinde yaz ve yönet.</p>
        </a>
      </div>
    </div>
  )
}
