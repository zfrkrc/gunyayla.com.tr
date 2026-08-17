import { searchPosts, getSiteSettings } from "@/lib/ghost"
import { NewsCard } from "@/components/news/NewsCard"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const settings = await getSiteSettings()
  const title = q ? `Arama: ${q}` : "Arama"
  return { title: `${title} - ${settings?.title || "GünYayla"}` }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q || ""
  const posts = await searchPosts(query)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-4">Arama</h1>
        <form action="/arama" method="GET" className="relative">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Haber başlığında ara…"
            className="w-full bg-[#0f0f16] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary transition"
          />
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
          </svg>
        </form>
      </div>

      {!query ? (
        <p className="text-gray-400 text-center py-16">Aramak istediğiniz kelimeyi yazın.</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">
            &ldquo;{query}&rdquo; için sonuç bulunamadı.
          </p>
          <Link href="/" className="text-primary hover:underline text-sm">Anasayfaya dön</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-6">
            &ldquo;{query}&rdquo; için <span className="text-gray-200 font-semibold">{posts.length}</span> sonuç bulundu.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {posts.map((post: any) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
