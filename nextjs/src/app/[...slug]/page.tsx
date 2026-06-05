import { getPage } from "@/lib/ghost"
import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string[] }> }

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params
  const pageSlug = slug.join("/")
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
