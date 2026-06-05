"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

type Photo = { id: string; url: string; caption: string | null; order: number }
type Album = { id: string; title: string; description: string | null; newsPostId: string | null }

type AlbumPageProps = { params: Promise<{ slug: string }> }

export default function AlbumPage({ params }: AlbumPageProps) {
  const [album, setAlbum]   = useState<Album | null>(null)
  const [photos, setPhotos]  = useState<Photo[]>([])
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [loading, setLoading]   = useState(true)
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    void params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    setLoading(true)
    fetch(`/api/gallery/${slug}`)
      .then((r) => r.json())
      .then((d) => { setAlbum(d.album); setPhotos(d.photos) })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="text-center py-20 text-gray-400">Yükleniyor…</div>
  if (!album)  return <div className="text-center py-20 text-gray-400">Albüm bulunamadı.</div>

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <Link href="/galeri" className="text-blue-500 text-sm hover:underline">← Galeriye dön</Link>
        <h1 className="text-3xl font-bold mt-2">{album.title}</h1>
        {album.description && <p className="text-gray-500 mt-1">{album.description}</p>}
        {album.newsPostId && (
          <Link href={`/haberler/${album.newsPostId}`} className="text-blue-500 text-sm hover:underline mt-1 inline-block">
            İlgili haberi okuyun →
          </Link>
        )}
      </div>

      {/* Fotoğraf ızgarası */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setLightbox(idx)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition"
          >
            <Image src={photo.url} alt={photo.caption ?? ""} fill className="object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl px-4 py-2 hover:bg-white/10 rounded"
            onClick={(e) => { e.stopPropagation(); setLightbox((l) => Math.max(0, (l ?? 0) - 1)) }}
          >‹</button>

          <div className="relative max-w-4xl max-h-[80vh] w-full mx-16" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[lightbox].url}
              alt={photos[lightbox].caption ?? ""}
              width={1200}
              height={800}
              className="object-contain max-h-[80vh] mx-auto rounded"
            />
            {photos[lightbox].caption && (
              <p className="text-center text-white/70 text-sm mt-3">{photos[lightbox].caption}</p>
            )}
            <p className="text-center text-white/40 text-xs mt-1">{lightbox + 1} / {photos.length}</p>
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl px-4 py-2 hover:bg-white/10 rounded"
            onClick={(e) => { e.stopPropagation(); setLightbox((l) => Math.min(photos.length - 1, (l ?? 0) + 1)) }}
          >›</button>

          <button
            className="absolute top-4 right-4 text-white text-2xl hover:bg-white/10 rounded px-3 py-1"
            onClick={() => setLightbox(null)}
          >✕</button>
        </div>
      )}
    </div>
  )
}
