import { getPostsByTagPaginated, getSiteSettings } from "@/lib/ghost"
import { NewsCard } from "@/components/news/NewsCard"
import { LoadMore } from "@/components/LoadMore"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function KoyPage() {
  const { posts, meta } = await getPostsByTagPaginated("k%C3%B6y", 1, 20)
  const settings = await getSiteSettings()
  const totalPages = meta?.pagination?.pages || 1

  if (posts.length === 0) {
    return (
      <div className="text-center py-32">
        <h1 className="text-3xl font-bold text-gray-400 mb-4">Henüz köy haberi yok</h1>
        <p className="text-gray-400">Yakında güncel köy haberleri burada olacak.</p>
      </div>
    )
  }

  const [hero, ...rest] = posts
  const sideNews = rest.slice(0, 3)
  const initialList = rest.slice(3)

  return (
    <div className="space-y-10">
      {/* ─── BAŞLIK ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="w-1 h-8 bg-green-700 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Köy Haberleri</h1>
          <p className="text-sm text-gray-400">Köyümüze özel haberler ve duyurular</p>
        </div>
      </div>

      {/* ─── MANŞET ────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <NewsCard post={hero} variant="hero" />
        </div>

        <div className="flex flex-col gap-4">
          {sideNews.map((post: any) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* ─── SON HABERLER ──────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <span className="w-1 h-6 bg-green-700 rounded-full" />
          <h2 className="text-lg font-bold text-gray-100">Son Köy Haberleri</h2>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {initialList.length > 0 ? (
          <LoadMore initialPosts={initialList} pageSize={6} tag="k%C3%B6y" />
        ) : (
          <p className="text-gray-400 text-center py-8">Daha fazla haber bulunmuyor.</p>
        )}
      </section>
    </div>
  )
}