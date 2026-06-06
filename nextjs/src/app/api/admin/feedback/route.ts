import { ghostAdminFetch } from "@/lib/ghost"
import { checkAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  let res
  try {
    res = await ghostAdminFetch("/posts/?limit=999&include=count.positive_feedback,count.negative_feedback")
  } catch {}
  if (!res || !res.ok) return NextResponse.json({ total: 0, posts: [] })
  const data = await res.json()

  const posts = (data.posts || [])
    .filter((p: any) => (p.count?.positive_feedback || 0) > 0 || (p.count?.negative_feedback || 0) > 0)
    .map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      published_at: p.published_at,
      image: p.feature_image,
      positiveCount: p.count?.positive_feedback || 0,
      negativeCount: p.count?.negative_feedback || 0,
      feedbackCount: (p.count?.positive_feedback || 0) + (p.count?.negative_feedback || 0),
    }))

  const total = posts.reduce((s: number, p: any) => s + p.feedbackCount, 0)
  return NextResponse.json({ total, posts })
}
