import { db, newsSubmissions } from "@/lib/db"
import { checkAdmin } from "@/lib/auth"
import { desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const rows = await db.select().from(newsSubmissions).orderBy(desc(newsSubmissions.createdAt))
  return NextResponse.json({ total: rows.length, submissions: rows })
}

export async function PATCH(req: Request) {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const body = await req.json()
  const { id, status } = body
  if (!id || !["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "id ve geçerli status gerekli" }, { status: 400 })
  }

  await db.update(newsSubmissions).set({ status }).where(eq(newsSubmissions.id, id))
  return NextResponse.json({ ok: true })
}
