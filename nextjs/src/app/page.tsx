import { getPosts, getTags, getSiteSettings } from "@/lib/ghost"
import { NewsCard } from "@/components/news/NewsCard"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { posts } = await getPosts(1, 10)
  const tags = await getTags()
  const settings = await getSiteSettings()
  const siteTitle = settings?.title || "GünYayla"
  const accentColor = settings?.accent_color || "#2563eb"

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
  const latest = rest.slice(7)

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
    <div className="space-y-12">
      {/* ─── MANŞET + SAĞ PANEL ──────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Büyük manşet — 2/3 */}
        <div className="lg:col-span-2">
          <NewsCard post={hero} variant="hero" />
        </div>

        {/* Sağ panel — 1/3 */}
        <div className="flex flex-col gap-4">
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

      {/* ─── SON HABERLER + SIDEBAR ──────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sol: haber listesi — 3/4 */}
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

          <div className="space-y-5">
            {[hero, ...rest].slice(0, 6).map((post: any, i: number) => (
              <Link
                key={post.id}
                href={`/haberler/${post.slug}`}
                className="group flex flex-col sm:flex-row gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-4"
              >
                {post.feature_image && (
                  <div className="relative w-full sm:w-56 h-44 sm:h-28 shrink-0 rounded-lg overflow-hidden">
                    <img
                      src={post.feature_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {post.tags?.[0] && (
                    <span
                      className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded mb-2 uppercase tracking-wider ${
                        tagColors[post.tags[0].slug] || "bg-gray-700"
                      }`}
                    >
                      {post.tags[0].name}
                    </span>
                  )}
                      <h3 className="text-base font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition leading-snug mb-1">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(post.published_at).toLocaleDateString("tr-TR", {
                      day: "numeric", month: "long", year: "numeric",
                    })} · {post.reading_time ?? 1} dk okuma
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sağ: sidebar — 1/4 */}
        <div className="space-y-6">
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
    </div>
  )
}
