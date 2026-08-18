"use client"

import { useSession } from "@/lib/auth-client"
import type { Session } from "@/lib/auth-types"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

const NAV = [
  { group: "Genel" },
  { href: "/admin", label: "Panel", icon: "📊", exact: true },
  { group: "Moderasyon" },
  { href: "/admin/news-submissions", label: "Haber Başvuruları", icon: "📨" },
  { href: "/admin/comments", label: "Yorumlar", icon: "💬" },
  { href: "/admin/feedback", label: "Geri Bildirim", icon: "👍" },
  { group: "Topluluk" },
  { href: "/admin/members", label: "Üyeler", icon: "👥" },
  { group: "İçerik & Dağıtım" },
  { href: "/admin/rss-sources", label: "RSS Kaynakları", icon: "📡" },
  { href: "/admin/reklam", label: "Reklam", icon: "📢" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  function isActive(item: (typeof NAV)[number] & { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href + "/")
  }

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
            {NAV.map((item, i) =>
              "group" in item ? (
                <div key={`g${i}`} className="pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {item.group}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive(item) ? "bg-[#0f0f16] text-white" : "text-gray-300 hover:bg-[#0f0f16]"
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              )
            )}
            <a href="/ghost" target="_blank" className="block px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
              ✏️ İçerik Yönetimi →
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
