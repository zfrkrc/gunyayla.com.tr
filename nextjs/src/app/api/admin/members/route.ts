import { ghostAdminFetch } from "@/lib/ghost"
import { checkAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  let all: any[] = []
  let page = 1
  while (true) {
    let res
    try { res = await ghostAdminFetch(`/members/?limit=50&page=${page}`) } catch {}
    if (!res || !res.ok) break
    const data = await res.json()
    if (!data.members?.length) break
    all = all.concat(data.members)
    if (data.meta?.pagination?.pages <= page) break
    page++
  }

  const members = all.map((m: any) => ({
    id: m.id,
    name: m.name || "İsimsiz",
    email: m.email,
    status: m.status,
    createdAt: m.created_at,
    lastSeen: m.last_seen_at,
    note: m.note,
  }))

  return NextResponse.json({ total: members.length, members })
}
