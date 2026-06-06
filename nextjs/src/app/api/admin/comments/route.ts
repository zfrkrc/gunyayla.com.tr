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
    try {
      res = await ghostAdminFetch(`/posts/?limit=50&page=${page}&fields=id,title,slug`)
    } catch {}
    if (!res || !res.ok) break
    const data = await res.json()
    if (!data.posts?.length) break
    const posts = data.posts

    const commentPromises = posts.map(async (post: any) => {
      let cres
      try {
        cres = await ghostAdminFetch(`/comments/post/${post.id}/?limit=50&include=member,post`)
      } catch {}
      if (!cres || !cres.ok) return []
      const cdata = await cres.json()
      return (cdata.comments || []).map((c: any) => ({
        id: c.id,
        html: c.html,
        status: c.status,
        createdAt: c.created_at,
        member: c.member ? { id: c.member.id, name: c.member.name, email: c.member.email } : null,
        post: { id: post.id, title: post.title, slug: post.slug },
      }))
    })

    const results = await Promise.all(commentPromises)
    all = all.concat(results.flat())

    if (data.meta?.pagination?.pages <= page) break
    if (page >= 5) break
    page++
  }

  return NextResponse.json({ total: all.length, comments: all })
}

export async function PUT(req: Request) {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const body = await req.json()
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id ve status gerekli" }, { status: 400 })
  }

  const res = await ghostAdminFetch(`/comments/${body.id}/`, {
    method: "PUT",
    body: JSON.stringify({ comments: [{ id: body.id, status: body.status }] }),
  })
  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    return NextResponse.json({ error: `Ghost hatası: ${res?.status} ${text}` }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  const body = await req.json()
  if (!body.id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 })
  }

  const res = await ghostAdminFetch(`/comments/${body.id}/`, {
    method: "DELETE",
  })
  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    return NextResponse.json({ error: `Ghost hatası: ${res?.status} ${text}` }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
