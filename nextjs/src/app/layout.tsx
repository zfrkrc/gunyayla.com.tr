import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"
import { Navbar } from "@/components/ui/Navbar"
import { SubscribeButton } from "@/components/SubscribeButton"
import { getSiteSettings } from "@/lib/ghost"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: settings?.title || "GünYayla Haber",
    description: settings?.description || "Güncel haberler ve galeri",
  }
}

function darken(hex: string, amount: number) {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0xff) - amount)
  const b = Math.max(0, (num & 0xff) - amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const siteTitle = settings?.title || "GünYayla"
  const siteDescription = settings?.description || "Güncel haberler, galeriler ve daha fazlası."
  const accentColor = settings?.accent_color || "#E8A020"
  const logo = settings?.logo || null
  const navigation = settings?.navigation || []
  const secondaryNav = settings?.secondary_navigation || []

  const cssVars = {
    "--color-primary": accentColor,
    "--color-primary-hover": darken(accentColor, 20),
    "--color-primary-light": accentColor + "1a",
    "--color-primary-dark": darken(accentColor, 60),
  } as React.CSSProperties

  return (
    <html lang="tr" style={cssVars}>
      <body className="min-h-screen bg-[#050508] text-gray-100">
        <Navbar siteTitle={siteTitle} logo={logo} navigation={navigation} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="bg-[#0f0f16] border-t border-white/10 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-bold text-gray-100 mb-3">{siteTitle}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{siteDescription}</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100 mb-3">Sayfalar</h3>
                <ul className="space-y-1.5">
                  {navigation.length > 0 ? navigation.map((item: any) => (
                    <li key={item.url}>
                      <Link href={item.url} className="text-xs text-gray-400 hover:text-primary transition">{item.label}</Link>
                    </li>
                  )) : (
                    <>
                      <li><Link href="/" className="text-xs text-gray-400 hover:text-primary transition">Haberler</Link></li>
                      <li><Link href="/koy" className="text-xs text-gray-400 hover:text-primary transition">Köy</Link></li>
                      <li><Link href="/galeri" className="text-xs text-gray-400 hover:text-primary transition">Galeri</Link></li>
                      <li><Link href="/haberler" className="text-xs text-gray-400 hover:text-primary transition">Tüm Haberler</Link></li>
                      <li><Link href="/reklam" className="text-xs text-gray-400 hover:text-primary transition">Reklam</Link></li>
                    </>
                  )}
                  <li><Link href="/haber-gonder" className="text-xs text-amber-400 hover:text-amber-300 transition">Haber Gönder</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100 mb-3">Kategoriler</h3>
                <ul className="space-y-1.5">
                  <li><Link href="/" className="text-xs text-gray-400 hover:text-primary transition">Gündem</Link></li>
                  <li><Link href="/" className="text-xs text-gray-400 hover:text-primary transition">Spor</Link></li>
                  <li><Link href="/" className="text-xs text-gray-400 hover:text-primary transition">Ekonomi</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100 mb-3">Bülten</h3>
                <p className="text-xs text-gray-400 mb-3">Haber bültenine abone ol, güncellemeleri kaçırma.</p>
                <SubscribeButton />
              </div>
            </div>
            <div className="border-t border-white/5 pt-6 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} {siteTitle} — Tüm hakları saklıdır.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
