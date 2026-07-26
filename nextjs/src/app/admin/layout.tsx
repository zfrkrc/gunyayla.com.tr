"use client"

import { useSession } from "@/lib/auth-client"
import type { Session } from "@/lib/auth-types"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    const s = (session ?? null) as Session | null
    if (!isPending && !s) {
      router.replace("/login")
    } else if (!isPending && s?.user?.role !== "admin") {
      router.replace("/")
    }
  }, [session, isPending])

  if (isPending) {
    return <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
  }

  const s = (session ?? null) as Session | null
  if (!s || s?.user?.role !== "admin") return null

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-8">
        <aside className="w-56 shrink-0">
          <nav className="space-y-1 sticky top-6">
            <Link href="/admin" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              📊 Panel
            </Link>
            <Link href="/admin/feedback" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              👍 Beğeniler
            </Link>
            <Link href="/admin/comments" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              💬 Yorumlar
            </Link>
            <Link href="/admin/members" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              👥 Üyeler
            </Link>
            <Link href="/admin/rss-sources" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              📡 RSS Kaynakları
            </Link>
            <Link href="/admin/reklam" className="block px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              📢 Reklam
            </Link>
            <a href="/ghost" target="_blank" className="block px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
              ✏️ Ghost Admin →
            </a>
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
