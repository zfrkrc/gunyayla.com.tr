import Link from "next/link"
import Image from "next/image"
import { tagColor } from "@/lib/tagColors"

type Post = {
  id: string
  title: string
  slug: string
  excerpt?: string
  feature_image?: string
  published_at: string
  reading_time?: number
  tags?: { name: string; slug: string }[]
}

export function NewsCard({
  post,
  variant = "default",
}: {
  post: Post
  variant?: "hero" | "featured" | "default"
}) {
  const date = new Date(post.published_at).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  })

  const tagBg = tagColor(post.tags?.[0]?.slug || "")

  if (variant === "hero") {
    return (
      <Link
        href={`/haberler/${post.slug}`}
        className="group relative block w-full h-[400px] md:h-[520px] rounded-2xl overflow-hidden shadow-lg"
      >
        {post.feature_image ? (
          <Image
            src={post.feature_image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-700"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          {post.tags?.[0] && (
            <span className={`inline-block px-3 py-1 ${tagBg} text-white text-xs font-bold rounded mb-4 uppercase tracking-wider`}>
              {post.tags[0].name}
            </span>
          )}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 line-clamp-3 leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-4 max-w-3xl leading-relaxed">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-3 text-gray-400 text-xs">
            <span>{date}</span>
            <span className="w-1 h-1 bg-[#050508]0 rounded-full" />
            <span>{post.reading_time ?? 1} dk okuma</span>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === "featured") {
    return (
      <Link
        href={`/haberler/${post.slug}`}
        className="group relative block h-52 md:h-64 rounded-xl overflow-hidden shadow-md"
      >
        {post.feature_image ? (
          <Image
            src={post.feature_image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          {post.tags?.[0] && (
            <span className={`inline-block px-2 py-0.5 ${tagBg} text-white text-[10px] font-bold rounded mb-2 uppercase tracking-wider`}>
              {post.tags[0].name}
            </span>
          )}
          <h2 className="text-base md:text-lg font-bold text-white line-clamp-2 leading-snug">
            {post.title}
          </h2>
          <span className="text-gray-400 text-xs mt-1 block">{date}</span>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/haberler/${post.slug}`}
      className="group block bg-[#0f0f16] rounded-xl border border-white/5 shadow-sm hover:shadow-lg transition-all overflow-hidden"
    >
      {post.feature_image && (
        <div className="relative h-44 overflow-hidden">
          <Image
            src={post.feature_image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
      )}
      <div className="p-4">
        {post.tags?.[0] && (
          <span className={`inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded mb-2 uppercase tracking-wider ${tagBg}`}>
            {post.tags[0].name}
          </span>
        )}
        <h2 className="font-bold text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-600 transition leading-snug">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <span className="text-xs text-gray-400">{date}</span>
      </div>
    </Link>
  )
}
