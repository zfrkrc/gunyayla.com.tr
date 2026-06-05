import { getPost } from "@/lib/ghost"

export const dynamic = 'force-dynamic'
export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return (
      <div className="text-center py-20 text-gray-400">
        Haber bulunamadı.
      </div>
    )
  }

  return (
    <article>
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <div className="text-gray-500 text-sm mb-6">
        {new Date(post.published_at).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.html || "<p>İçerik bulunamadı.</p>" }}
      />
    </article>
  )
}
