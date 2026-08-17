import { getPosts } from "@/lib/ghost"
import { NewsCard } from "@/components/news/NewsCard"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function HaberlerPage() {
  const { posts } = await getPosts(1, 20)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Haberler</h1>
        <p className="text-gray-400 mt-1">Tüm güncel haberler</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-400 text-lg">Henüz yayınlanmış haber yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
