import { checkAdmin } from "@/lib/auth"
import { NextResponse } from "next/server"
import { writeFileSync } from "fs"

const SIGNAL_FILE = "/data/restart-signal"

export async function POST() {
  const authErr = await checkAdmin()
  if (authErr) return authErr

  writeFileSync(SIGNAL_FILE, new Date().toISOString())
  return NextResponse.json({ success: true, message: "Bot yeniden başlatılıyor..." })
}
