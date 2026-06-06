import { getPosts } from "@/lib/ghost"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get("page") || "2")
  const limit = parseInt(url.searchParams.get("limit") || "6")

  const result = await getPosts(page, limit)
  return NextResponse.json(result)
}
