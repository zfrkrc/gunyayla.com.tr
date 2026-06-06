"use client"

import { useState } from "react"
import { NewsCard } from "@/components/news/NewsCard"

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

export function LoadMore({
  initialPosts,
  pageSize = 6,
}: {
  initialPosts: Post[]
  pageSize?: number
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(2)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadMore = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?page=${page}&limit=${pageSize}`)
      const data = await res.json()
      if (data.posts?.length) {
        setPosts((prev) => [...prev, ...data.posts])
        setPage((p) => p + 1)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {posts.map((post) => (
          <NewsCard key={post.id} post={post} />
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-primary text-white px-8 py-2.5 rounded-lg hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Yükleniyor...
              </span>
            ) : (
              "Daha Fazla Haber ↓"
            )}
          </button>
        </div>
      )}
    </>
  )
}
