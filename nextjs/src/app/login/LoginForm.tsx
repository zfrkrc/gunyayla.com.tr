"use client"

import { useState } from "react"
import { signIn, signUp } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function LoginForm({ siteTitle }: { siteTitle: string }) {
  const router = useRouter()
  const [tab, setTab]       = useState<"giris" | "kayit">("giris")
  const [email, setEmail]   = useState("")
  const [password, setPassword] = useState("")
  const [name, setName]     = useState("")
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (tab === "giris") {
        const { error } = await signIn.email({ email, password, callbackURL: "/" })
        if (error) {
          setError(error.message ?? "Bir hata oluştu")
          return
        }
      } else {
        const { error, data } = await signUp.email({ email, password, name, callbackURL: "/" })
        if (error) {
          const message = error.message ?? "Bir hata oluştu"
          if (message.toLowerCase().includes("doğrulanmamış") || message.toLowerCase().includes("verify")) {
            setVerificationSent(true)
          }
          setError(message)
          return
        }
        fetch("/api/ghost-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name }),
        })
      }
      router.push("/")
    } catch (err: any) {
      setError(err?.message ?? "Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  async function resendVerification() {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setError("")
        setVerificationSent(true)
      } else {
        const data = await res.json()
        setError(data.error || data.message || "Gönderilemedi")
      }
    } catch {
      setError("Bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    await signIn.social({ provider: "google", callbackURL: "/" })
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{siteTitle}</h1>

        {/* Tab */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          {(["giris", "kayit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={"flex-1 py-2 text-sm font-medium transition " + (tab === t ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50")}
            >
              {t === "giris" ? "Giriş Yap" : "Üye Ol"}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google ile devam et
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">veya</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {tab === "kayit" && (
            <input
              type="text"
              placeholder="Adınız"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {tab === "giris" && (
            <div className="text-right">
              <Link href="/sifre-sifirla" className="text-xs text-primary hover:underline">
                Şifremi unuttum
              </Link>
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          {verificationSent && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-xs text-yellow-700">
              Doğrulama e-postası gönderildi. Spam klasörünü kontrol edin.
              <button type="button" onClick={resendVerification} disabled={loading} className="ml-1 underline hover:no-underline">
                Tekrar gönder
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-hover transition disabled:opacity-50"
          >
            {loading ? "Lütfen bekleyin…" : tab === "giris" ? "Giriş Yap" : "Üye Ol"}
          </button>
        </form>
      </div>
    </div>
  )
}
