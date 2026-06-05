import { syncGhostMember } from "@/lib/ghost"

export async function POST(request: Request) {
  const { email, name, prefix } = await request.json()
  if (!email) {
    return Response.json({ error: "E-posta gerekli" }, { status: 400 })
  }
  await syncGhostMember(email, name || email.split("@")[0], prefix || "Kayit IP: bilinmiyor")
  return Response.json({ ok: true })
}
