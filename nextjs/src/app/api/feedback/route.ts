import { db, postFeedback } from "@/lib/db"
import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  const body = await req.json()
  const { postId, email, score } = body
  if (!postId || score === undefined) {
    return NextResponse.json({ error: "postId ve score gerekli" }, { status: 400 })
  }

  const s = score === "1" || score === 1 ? 1 : 0

  if (email) {
    const existing = await db
      .select()
      .from(postFeedback)
      .where(and(eq(postFeedback.postId, postId), eq(postFeedback.email, email)))
      .limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ feedback: existing[0], message: "Zaten oy kullandın" })
    }
  }

  const feedback = {
    id: crypto.randomUUID(),
    postId,
    email: email?.trim() || null,
    score: s,
  }

  await db.insert(postFeedback).values(feedback)

  const counts = await db
    .select()
    .from(postFeedback)
    .where(eq(postFeedback.postId, postId))
  const likes = counts.filter(f => f.score === 1).length
  const dislikes = counts.filter(f => f.score === 0).length

  return NextResponse.json({ feedback, counts: { likes, dislikes } })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const postId = url.searchParams.get("postId")
  if (!postId) return NextResponse.json({ error: "postId gerekli" }, { status: 400 })

  const rows = await db
    .select()
    .from(postFeedback)
    .where(eq(postFeedback.postId, postId))
  const likes = rows.filter(f => f.score === 1).length
  const dislikes = rows.filter(f => f.score === 0).length

  return NextResponse.json({ counts: { likes, dislikes } })
}
