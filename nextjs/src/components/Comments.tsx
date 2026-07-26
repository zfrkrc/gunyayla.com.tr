"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import Script from "next/script"

type Comment = {
  id: string
  postId: string
  name: string
  email: string | null
  content: string
  parentId: string | null
  createdAt: string
  replies?: Comment[]
}

export function Comments({ postId }: { postId: string }) {
  const { data: session, isPending: sessionLoading } = useSession()
  const [items, setItems] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"

  useEffect(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then(r => { if (!r.ok) throw new Error("Yorumlar yüklenemedi"); return r.json() })
      .then(d => setItems(d.comments || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => {
    const el = document.getElementById("cf-turnstile-comments")
    if (!el || typeof (window as any).turnstile === "undefined") return
    if (el.childNodes.length > 0) return
    ;(window as any).turnstile.render(el, { sitekey: turnstileKey, theme: "light" })
  }, [])

  function resetTurnstile() {
    const el = document.getElementById("cf-turnstile-comments")
    if (el && typeof (window as any).turnstile !== "undefined") {
      ;(window as any).turnstile.reset(el)
    }
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    const token = (window as any).turnstile?.getResponse()
    if (token === undefined) {
      setError("Lütfen doğrulamayı tamamla")
      return
    }

    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId: replyTo, turnstileToken: token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Yorum gönderilemedi")
        resetTurnstile()
        return
      }

      const c = { ...data.comment, replies: [] }
      if (replyTo) {
        setItems(prev => prev.map(p =>
          p.id === replyTo
            ? { ...p, replies: [...(p.replies || []), c] }
            : p
        ))
      } else {
        setItems(prev => [c, ...prev])
      }
      setContent("")
      setReplyTo(null)
      resetTurnstile()
    } catch {
      setError("Bir hata oluştu")
      resetTurnstile()
    } finally {
      setSending(false)
    }
  }

  function CommentCard({ c }: { c: Comment }) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
            {(c.name?.[0] || "?").toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700">{c.name}</span>
          <span className="text-xs text-gray-400">
            {new Date(c.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.content}</p>
        <button
          onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
          className="text-xs text-primary hover:underline mt-2"
        >
          {replyTo === c.id ? "İptal" : "Yanıtla"}
        </button>
        {c.replies && c.replies.length > 0 && (
          <div className="ml-6 mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
            {c.replies.map(r => (
              <div key={r.id}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600">{r.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <h3 className="text-lg font-bold text-gray-800 mb-6">Yorumlar ({items.length})</h3>

      {loading ? (
        <p className="text-sm text-gray-400">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 mb-8">Henüz yorum yok. İlk yorumu sen yap!</p>
      ) : (
        <div className="space-y-4 mb-8">
          {items.map(c => <CommentCard key={c.id} c={c} />)}
        </div>
      )}

      {!sessionLoading && !session ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
          <p className="text-sm text-gray-600 mb-3">Yorum yapmak için giriş yapmalısın.</p>
          <Link
            href="/login"
            className="inline-block bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition"
          >
            Giriş Yap
          </Link>
        </div>
      ) : session ? (
        <form onSubmit={sendComment} className="space-y-3 bg-gray-50 rounded-xl p-5">
          {replyTo && (
            <p className="text-xs text-gray-500">
              {items.find(c => c.id === replyTo)?.name || "Yorumu"} yanıtlıyorsun
            </p>
          )}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={replyTo ? "Yanıtını yaz…" : "Yorumunu yaz…"}
            rows={3}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
          <div id="cf-turnstile-comments" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Gönderiliyor…" : replyTo ? "Yanıtla" : "Yorum Gönder"}
          </button>
        </form>
      ) : null}
    </div>
  )
}
