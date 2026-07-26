import { getPosts, getPostsByTagPaginated } from "@/lib/ghost"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get("page") || "2")
  const limit = parseInt(url.searchParams.get("limit") || "6")
  const tag = url.searchParams.get("tag")

  const result = tag
    ? await getPostsByTagPaginated(tag, page, limit)
    : await getPosts(page, limit)
  return NextResponse.json(result)
}
