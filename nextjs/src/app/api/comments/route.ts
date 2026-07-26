import { auth } from "@/lib/auth"
import { db, comments } from "@/lib/db"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const postId = url.searchParams.get("postId")
  if (!postId) return NextResponse.json({ error: "postId gerekli" }, { status: 400 })

  const rows = await db
    .select()
    .from(comments)
    .where(and(eq(comments.postId, postId), eq(comments.status, "approved")))
    .orderBy(desc(comments.createdAt))
    .limit(50)

  const topLevel = rows.filter(c => !c.parentId)
  const replies = rows.filter(c => c.parentId)

  const withReplies = topLevel.map(c => ({
    ...c,
    replies: replies.filter(r => r.parentId === c.id),
  }))

  return NextResponse.json({ comments: withReplies })
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Giriş yapmalısın" }, { status: 401 })

  const body = await req.json()
  const { postId, content, parentId, turnstileToken } = body
  if (!postId || !content) {
    return NextResponse.json({ error: "postId ve content gerekli" }, { status: 400 })
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (secretKey) {
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: turnstileToken || "" }),
    })
    const result = await verify.json()
    if (!result.success) {
      return NextResponse.json({ error: "Doğrulama başarısız" }, { status: 403 })
    }
  }

  const comment = {
    id: crypto.randomUUID(),
    postId,
    name: session.user.name || session.user.email || "Kullanıcı",
    email: session.user.email || null,
    content: content.trim(),
    parentId: parentId || null,
    status: "approved",
  }

  await db.insert(comments).values(comment)
  return NextResponse.json({ comment })
}
