"use client"

import { useState } from "react"

export function SubscribeButton() {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes("@")) return
    setSending(true)
    setMessage("")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) setMessage("✅ Abone oldun!")
      else setMessage("❌ " + (data.error || "Bir hata oluştu"))
    } catch {
      setMessage("❌ Bir hata oluştu")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="E-posta adresin"
        required
        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="submit"
        disabled={sending || !email.includes("@")}
        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition disabled:opacity-50 shrink-0"
      >
        {sending ? "…" : "Abone Ol"}
      </button>
      {message && <span className="text-xs text-gray-500 self-center">{message}</span>}
    </form>
  )
}
