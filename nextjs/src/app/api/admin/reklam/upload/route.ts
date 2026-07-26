import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { uploadFile } from "@/lib/storage"
import { v4 as uuid } from "uuid"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || !["editor", "admin"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Yetkiniz yok" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "Dosya zorunlu" }, { status: 400 })
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const filename = `ads/${uuid()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(filename, buffer, file.type || `image/${ext}`)

  return NextResponse.json({ url })
}
