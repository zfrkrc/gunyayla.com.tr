import { db, newsSubmissions } from "@/lib/db"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 })
  }

  const name = (body.name || "").toString().trim()
  const email = (body.email || "").toString().trim()
  const phone = (body.phone || "").toString().trim()
  const title = (body.title || "").toString().trim()
  const content = (body.content || "").toString().trim()

  if (!name || !title || !content) {
    return NextResponse.json({ error: "Ad, başlık ve içerik zorunludur" }, { status: 400 })
  }
  if (content.length < 20) {
    return NextResponse.json({ error: "İçerik çok kısa (en az 20 karakter)" }, { status: 400 })
  }

  const submission = {
    id: crypto.randomUUID(),
    name,
    email: email || null,
    phone: phone || null,
    title,
    content,
    status: "pending",
  }

  await db.insert(newsSubmissions).values(submission)

  return NextResponse.json({ ok: true, message: "Haber başvurunuz alındı" })
}
