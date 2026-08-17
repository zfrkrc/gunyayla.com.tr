"use client"

import { useState } from "react"
import Link from "next/link"

export default function HaberGonderPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("sending")
    setError("")

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch("/api/news-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Bir hata oluştu")
        setStatus("error")
        return
      }
      setStatus("success")
      form.reset()
    } catch {
      setError("Bağlantı hatası, lütfen tekrar deneyin.")
      setStatus("error")
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-2">Haber Gönder</h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Köyümüzden bir haberiniz mi var? Düğün, etkinlik, duyuru ya da önemli bir gelişme —
          bize iletin, editörlerimiz değerlendirip yayınlasın.
        </p>
      </div>

      {status === "success" ? (
        <div className="bg-[#0f0f16] border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center text-2xl">✓</div>
          <h2 className="text-lg font-bold text-gray-100 mb-2">Başvurunuz alındı</h2>
          <p className="text-sm text-gray-400 mb-6">Haberiniz editörlerimize iletildi. Uygun görülürse yayınlanacaktır.</p>
          <Link href="/" className="text-primary hover:underline text-sm">Anasayfaya dön</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="bg-[#0f0f16] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-300 mb-1">Ad Soyad *</label>
              <input
                id="name" name="name" type="text" required
                className="w-full bg-[#050508]/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary"
                placeholder="Adınız"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-300 mb-1">E-posta</label>
              <input
                id="email" name="email" type="email"
                className="w-full bg-[#050508]/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary"
                placeholder="ornek@mail.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-gray-300 mb-1">Telefon</label>
            <input
              id="phone" name="phone" type="tel"
              className="w-full bg-[#050508]/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary"
              placeholder="İletişim için (opsiyonel)"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-gray-300 mb-1">Haber Başlığı *</label>
            <input
              id="title" name="title" type="text" required
              className="w-full bg-[#050508]/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary"
              placeholder="Haberinizin kısa başlığı"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-xs font-semibold text-gray-300 mb-1">Haber Detayı *</label>
            <textarea
              id="content" name="content" required rows={6}
              className="w-full bg-[#050508]/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-primary"
              placeholder="Ne oldu, nerede, ne zaman? Mümkün olduğunca detaylı yazın."
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-hover transition disabled:opacity-50"
          >
            {status === "sending" ? "Gönderiliyor…" : "Haber Gönder"}
          </button>
        </form>
      )}
    </div>
  )
}
