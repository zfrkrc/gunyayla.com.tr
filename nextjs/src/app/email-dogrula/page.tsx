"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function EmailDogrulaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get("status")

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold mb-2">E-posta doğrulandı</h1>
          <p className="text-sm text-gray-500 mb-4">Hesabınız başarıyla doğrulandı.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition"
          >
            Ana Sayfa
          </button>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold mb-2">Doğrulama başarısız</h1>
          <p className="text-sm text-gray-500 mb-4">
            Bağlantı geçersiz veya süresi dolmuş olabilir.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-blue-700 transition"
          >
            Ana Sayfa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-xl font-bold mb-2">E-posta Doğrulama</h1>
        <p className="text-sm text-gray-500">
          E-posta adresinize gönderilen bağlantıya tıklayarak hesabınızı doğrulayın.
        </p>
      </div>
    </div>
  )
}

export default function EmailDogrulaPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Yükleniyor…</div>}>
      <EmailDogrulaContent />
    </Suspense>
  )
}
