"use client"

import Link from "next/link"
import { useRef } from "react"

type Post = {
  slug: string
  title: string
}

export function BreakingTicker({ posts }: { posts: Post[] }) {
  if (!posts.length) return null

  return (
    <div className="bg-red-600 text-white text-sm overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-stretch">
        <div className="bg-red-800 px-4 py-2 font-bold text-xs uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Son Dakika
        </div>
        <div className="overflow-hidden relative flex-1">
          <div className="animate-marquee whitespace-nowrap py-2 flex">
            {[...posts, ...posts, ...posts].map((post, i) => (
              <span key={`${post.slug}-${i}`} className="inline-flex items-center gap-2 mx-4">
                <span className="w-1 h-1 bg-red-300 rounded-full" />
                <Link href={`/haberler/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
