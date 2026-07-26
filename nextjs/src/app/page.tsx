import { getPosts, getTags, getSiteSettings } from "@/lib/ghost"
import { NewsCard } from "@/components/news/NewsCard"
import { BreakingTicker } from "@/components/BreakingTicker"
import { WeatherWidget } from "@/components/WeatherWidget"
import { LoadMore } from "@/components/LoadMore"
import { AdDisplay } from "@/components/AdDisplay"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { posts, meta } = await getPosts(1, 20)
  const tags = await getTags()
  const settings = await getSiteSettings()
  const siteTitle = settings?.title || "GünYayla"
  const accentColor = settings?.accent_color || "#2563eb"
  const totalPages = meta?.pagination?.pages || 1

  if (posts.length === 0) {
    return (
      <div className="text-center py-32">
        <h1 className="text-3xl font-bold text-gray-400 mb-4">Henüz haber yok</h1>
        <p className="text-gray-500">Yakında güncel haberler burada olacak.</p>
      </div>
    )
  }

  const [hero, ...rest] = posts
  const sideNews = rest.slice(0, 3)
  const featured = rest.slice(3, 7)
  const initialList = rest.slice(7)

  const tagColors: Record<string, string> = {
    news: "bg-red-600",
    spor: "bg-green-600",
    ekonomi: "bg-blue-600",
    teknoloji: "bg-purple-600",
    kültür: "bg-orange-600",
    sanat: "bg-pink-600",
    sağlık: "bg-teal-600",
    eğitim: "bg-indigo-600",
  }

  return (
    <div className="space-y-10">
      {/* ─── SON DAKİKA BANDI ────────────────────────────── */}
      <BreakingTicker posts={[hero, ...rest]} />

      {/* ─── MANŞET + SAĞ PANEL ──────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <NewsCard post={hero} variant="hero" />
        </div>

        <div className="flex flex-col gap-4">
          <WeatherWidget latitude={39.3618} longitude={35.6256} city="GünYayla" />
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6908.561857007404!2d35.62555581775482!3d39.361825186041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x407f728632d930c7%3A0x9844ed08acecde90!2zR8O8bnlheWxhLCBCYcSfbGFyYmHFn8SxLCA2NjYwMiBHw7xueWF5bGEvw4dhecSxcmFsYW4vWW96Z2F0!5e1!3m2!1str!2str!4v1780694379480!5m2!1str!2str"
              width="100%"
              height="180"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="GünYayla Konumu"
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-red-600 rounded-full" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Son Dakika</h2>
            </div>
            <div className="space-y-3">
              {[hero, ...sideNews].slice(0, 4).map((post: any) => (
                <Link
                  key={post.id}
                  href={`/haberler/${post.slug}`}
                  className="group flex items-start gap-3"
                >
                  <span className="w-2 h-2 mt-1.5 bg-red-500 rounded-full shrink-0 group-hover:bg-red-700 transition" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-red-600 transition leading-snug">
                      {post.title}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      {new Date(post.published_at).toLocaleDateString("tr-TR", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── REKLAM (Anasayfa - Manset Alti) ──────────────── */}
      <AdDisplay category="anasayfa" className="flex justify-center" />

      {/* ─── KATEGORİ ETİKETLERİ ─────────────────────────── */}
      {tags.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {tags.map((tag: any) => (
            <Link
              key={tag.slug}
              href={`/?tag=${tag.slug}`}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition hover:opacity-80 ${
                tagColors[tag.slug] || "bg-gray-700"
              } text-white`}
            >
              {tag.name}
            </Link>
          ))}
        </section>
      )}

      {/* ─── REKLAM (Şehir Markası) ──────────────────────── */}
      <AdDisplay category="sehir" className="flex justify-center" />

      {/* ─── ÖNE ÇIKANLAR ────────────────────────────────── */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h2 className="text-lg font-bold text-gray-800">Öne Çıkan Haberler</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((post: any) => (
              <NewsCard key={post.id} post={post} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {/* ─── REKLAM (Icerik Arasi) ────────────────────────── */}
      <AdDisplay category="alan" className="flex justify-center" />

      {/* ─── SON HABERLER + SIDEBAR ──────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-6 bg-gray-800 rounded-full" />
            <h2 className="text-lg font-bold text-gray-800">Son Haberler</h2>
            <div className="flex-1 border-t border-gray-200" />
            <Link
              href="/haberler"
              className="text-sm font-medium text-primary hover:text-primary transition shrink-0"
            >
              Tüm Haberler →
            </Link>
          </div>

          {initialList.length > 0 ? (
            <LoadMore initialPosts={initialList} pageSize={6} />
          ) : (
            <p className="text-gray-400 text-center py-8">Daha fazla haber bulunmuyor.</p>
          )}
        </div>

        <div className="space-y-6">
          <AdDisplay category="yan" />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-orange-500 rounded-full" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Popüler</h3>
            </div>
            <div className="space-y-4">
              {[hero, ...rest].slice(0, 5).map((post: any, i: number) => (
                <Link
                  key={post.id}
                  href={`/haberler/${post.slug}`}
                  className="group flex gap-3"
                >
                  <span className="text-lg font-black text-gray-300 leading-none shrink-0 w-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-primary transition leading-snug">
                      {post.title}
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      {new Date(post.published_at).toLocaleDateString("tr-TR", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="rounded-xl p-5 text-white"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
          >
            <h3 className="font-bold text-lg mb-2">{siteTitle}</h3>
            <p className="text-sm text-blue-100 mb-4 leading-relaxed">
              {settings?.description || "Güncel haberler, galeriler ve daha fazlası için bizi takip edin."}
            </p>
          </div>
        </div>
      </section>

      {/* ─── REKLAM (Diğer) ──────────────────────────────── */}
      <AdDisplay category="diger" className="flex justify-center" />
    </div>
  )
}
