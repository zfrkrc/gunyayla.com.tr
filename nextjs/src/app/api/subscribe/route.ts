import { ghostAdminFetch } from "@/lib/ghost"
import { NextResponse } from "next/server"

const NEWSLETTER_ID = process.env.NEWSLETTER_ID || "6a21aaae9119b80001f0f0b2"

export async function POST(req: Request) {
  const body = await req.json()
  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin" }, { status: 400 })
  }

  const res = await ghostAdminFetch("/members/", {
    method: "POST",
    body: JSON.stringify({
      members: [{
        email,
        name: body.name?.trim() || email.split("@")[0],
        newsletters: [{ id: NEWSLETTER_ID }],
      }],
    }),
  })

  if (!res || !res.ok) {
    const text = res ? await res.text() : "no response"
    return NextResponse.json({ error: "Abonelik oluşturulamadı: " + text }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: "Haber bültenine abone oldun!" })
}
