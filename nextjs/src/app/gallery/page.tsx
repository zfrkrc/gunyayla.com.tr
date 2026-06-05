import { db, albums, photos } from "@/lib/db"
import { eq, count } from "drizzle-orm"
import Link from "next/link"
import Image from "next/image"

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function GalleryPage() {
  const allAlbums = await db.select().from(albums).orderBy(albums.createdAt)

  // Her albümün fotoğraf sayısını çek
  const counts = await Promise.all(
    allAlbums.map(async (album) => {
      const [{ value }] = await db
        .select({ value: count() })
        .from(photos)
        .where(eq(photos.albumId, album.id))
      return { id: album.id, count: Number(value) }
    })
  )
  const countMap = Object.fromEntries(counts.map((c) => [c.id, c.count]))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Galeri</h1>
      <p className="text-gray-500 mb-8">Fotoğraf albümleri</p>

      {allAlbums.length === 0 ? (
        <p className="text-gray-400 text-center py-16">Henüz albüm yok.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allAlbums.map((album) => (
            <Link
              key={album.id}
              href={`/galeri/${album.slug}`}
              className="group rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition"
            >
              {/* Kapak fotoğrafı */}
              <div className="relative h-52 bg-gray-100">
                {album.coverImage ? (
                  <Image
                    src={album.coverImage}
                    alt={album.title}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-5xl">🖼️</div>
                )}
              </div>

              {/* Bilgi */}
              <div className="p-4 bg-white">
                <h2 className="font-semibold text-gray-800 mb-1 line-clamp-1">{album.title}</h2>
                {album.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{album.description}</p>
                )}
                <span className="text-xs text-gray-400">
                  {countMap[album.id] ?? 0} fotoğraf
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
