import { getPage, getPost, getSiteSettings } from "@/lib/ghost"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { AdDisplay } from "@/components/AdDisplay"
import { Comments } from "@/components/Comments"
import { tagColor } from "@/lib/tagColors"
import { ShareButtons } from "@/components/ShareButtons"

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string[] }> }

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params
  const pageSlug = slug.join("/")

  // Try news post first (preserves hash fragments for Ghost feedback/comment links)
  const post = await getPost(pageSlug)
  if (post) {
    const settings = await getSiteSettings()
    const accentColor = settings?.accent_color || "#E8A020"
    const date = new Date(post.published_at).toLocaleDateString("tr-TR", {
      day: "numeric", month: "long", year: "numeric",
    })

    return (
      <article className="max-w-4xl mx-auto">
        {post.feature_image && (
          <div className="relative w-full h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-8 shadow-md">
            <Image src={post.feature_image} alt={post.title} fill className="object-cover" priority />
          </div>
        )}

        {post.tags?.[0] && (
          <span className={`inline-block text-xs font-bold text-white px-3 py-1 rounded-full mb-4 uppercase tracking-wider ${tagColor(post.tags[0].slug)}`}>
            {post.tags[0].name}
          </span>
        )}

        <h1 className="text-3xl md:text-5xl font-bold text-gray-100 leading-tight mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400 mb-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span>{date}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>{post.reading_time ?? 1} dk okuma</span>
            {post.authors?.[0] && (
              <><span className="w-1 h-1 bg-gray-300 rounded-full" /><span>{post.authors[0].name}</span></>
            )}
          </div>
          <ShareButtons title={post.title} slug={post.slug} />
        </div>

        <AdDisplay category="altsayfa" className="mb-6 flex justify-center" />
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-100 prose-a:text-primary prose-img:rounded-xl prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: post.html || "<p>İçerik bulunamadı.</p>" }}
        />
        <AdDisplay category="paragraf" className="mt-6 flex justify-center" />

        <div
          className="mt-12 rounded-xl p-6 text-white text-center"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
        >
          <h3 className="font-bold text-lg mb-1">{settings?.title || "GünYayla"}</h3>
          <p className="text-sm opacity-90">{settings?.description || "Güncel haberler için bizi takip edin."}</p>
        </div>

        <Comments postId={post.id} />
      </article>
    )
  }

  // Fallback: Ghost page
  const page = await getPage(pageSlug)
  if (!page) {
    notFound()
  }

  return (
    <article>
      <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: page.html || "<p>İçerik bulunamadı.</p>" }}
      />
    </article>
  )
}
