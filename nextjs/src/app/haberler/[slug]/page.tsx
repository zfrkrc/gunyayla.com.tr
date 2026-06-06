import { getPost, getSiteSettings } from "@/lib/ghost"
import Image from "next/image"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Haber bulunamadı" }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.og_title || post.meta_title || post.title,
      description: post.og_description || post.meta_description || post.excerpt,
      image: post.og_image || post.feature_image,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  const settings = await getSiteSettings()
  const accentColor = settings?.accent_color || "#2563eb"

  if (!post) {
    return (
      <div className="text-center py-32">
        <h1 className="text-3xl font-bold text-gray-400 mb-4">Haber bulunamadı</h1>
        <Link href="/" className="text-primary hover:underline text-sm">Anasayfaya dön</Link>
      </div>
    )
  }

  const date = new Date(post.published_at).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })

  const tagColors: Record<string, string> = {
    news: "bg-red-600", spor: "bg-green-600", ekonomi: "bg-blue-600",
    teknoloji: "bg-purple-600", kültür: "bg-orange-600", sanat: "bg-pink-600",
    sağlık: "bg-teal-600", eğitim: "bg-indigo-600",
  }

  return (
    <article className="max-w-4xl mx-auto">
      {/* Kapak görseli */}
      {post.feature_image && (
        <div className="relative w-full h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-8 shadow-md">
          <Image
            src={post.feature_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Etiket */}
      {post.tags?.[0] && (
        <span
          className={`inline-block text-xs font-bold text-white px-3 py-1 rounded-full mb-4 uppercase tracking-wider ${
            tagColors[post.tags[0].slug] || "bg-gray-700"
          }`}
        >
          {post.tags[0].name}
        </span>
      )}

      {/* Başlık */}
      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-100">
        <span>{date}</span>
        <span className="w-1 h-1 bg-gray-300 rounded-full" />
        <span>{post.reading_time ?? 1} dk okuma</span>
        {post.authors?.[0] && (
          <>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>{post.authors[0].name}</span>
          </>
        )}
      </div>

      {/* İçerik */}
      <div
        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-primary prose-img:rounded-xl prose-img:shadow-md"
        dangerouslySetInnerHTML={{ __html: post.html || "<p>İçerik bulunamadı.</p>" }}
      />

      {/* Alt bilgi */}
      <div
        className="mt-12 rounded-xl p-6 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
      >
        <h3 className="font-bold text-lg mb-1">{settings?.title || "GünYayla"}</h3>
        <p className="text-sm opacity-90">
          {settings?.description || "Güncel haberler için bizi takip edin."}
        </p>
      </div>
    </article>
  )
}
