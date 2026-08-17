"use client"

import Link from "next/link"
import { useSession, signOut } from "@/lib/auth-client"
import Image from "next/image"
import { useState } from "react"

export function Navbar({
  siteTitle,
  logo,
  navigation,
}: {
  siteTitle: string
  logo: string | null
  navigation: { label: string; url: string }[]
}) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-[#0f2238] border-b border-white/10 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
          {logo ? (
            <Image src={logo} alt={siteTitle} width={32} height={32} className="h-8 w-auto" />
          ) : null}
          {siteTitle}
        </Link>

        {/* Nav linkleri - masaüstü */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navigation.length > 0
            ? navigation.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className="px-3 py-2 text-gray-200 hover:text-white hover:bg-[#0f0f16]/10 rounded-lg transition"
                >
                  {item.label}
                </Link>
              ))
            : (
              <Link href="/" className="px-3 py-2 text-gray-200 hover:text-white hover:bg-[#0f0f16]/10 rounded-lg transition">
                Haberler
              </Link>
            )}
          <Link href="/haber-gonder" className="px-3 py-2 text-amber-400 hover:text-amber-300 rounded-lg transition font-semibold">
            Haber Gönder
          </Link>
        </nav>

        {/* Arama - masaüstü */}
        <form action="/arama" method="GET" className="hidden lg:flex items-center">
          <div className="relative">
            <input
              type="search"
              name="q"
              placeholder="Haber ara…"
              className="w-44 bg-[#0f0f16]/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary transition"
            />
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </form>

        {/* Mobil menü butonu */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Kullanıcı */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-gray-100"
              >
                {session.user.image ? (
                  <Image src={session.user.image} alt="" width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="hidden sm:inline">{session.user.name}</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-44 bg-[#0f0f16] rounded-xl shadow-lg border border-white/5 py-1 text-sm">
                  {["editor", "admin"].includes((session.user as any).role) && (
                    <Link
                      href="/editor"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 text-gray-300 hover:bg-[#050508]"
                    >
                      Editör Paneli
                    </Link>
                  )}
                  <button
                    onClick={() => { signOut(); setOpen(false) }}
                    className="block w-full text-left px-4 py-2 text-red-500 hover:bg-[#050508]"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-hover transition"
            >
              Giriş Yap
            </Link>
          )}
        </div>
      </div>

      {/* Mobil menü */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#0f0f16] px-4 py-3 space-y-2">
          <form action="/arama" method="GET" className="relative mb-1">
            <input
              type="search"
              name="q"
              placeholder="Haber ara…"
              className="w-full bg-[#050508]/60 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
            </svg>
          </form>
          {navigation.length > 0
            ? navigation.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-gray-300 hover:bg-primary-light rounded-lg text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))
            : (
              <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-gray-300 hover:bg-primary-light rounded-lg text-sm font-medium">Haberler</Link>
            )}
          <Link href="/haber-gonder" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-amber-400 hover:bg-[#050508] rounded-lg text-sm font-semibold">Haber Gönder</Link>
          {session ? (
            <>
              {["editor", "admin"].includes((session.user as any).role) && (
                <Link href="/editor" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-gray-300 hover:bg-[#050508] rounded-lg text-sm">Editör Paneli</Link>
              )}
              <button onClick={() => { signOut(); setMobileOpen(false) }} className="block w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm">Çıkış Yap</button>
            </>
          ) : (
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-primary hover:bg-primary-light rounded-lg text-sm font-medium">Giriş Yap</Link>
          )}
        </div>
      )}
    </header>
  )
}
