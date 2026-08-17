export const tagColors: Record<string, string> = {
  news: "bg-red-600",
  gundem: "bg-red-600",
  spor: "bg-green-600",
  ekonomi: "bg-blue-600",
  teknoloji: "bg-purple-600",
  kültür: "bg-orange-600",
  kultur: "bg-orange-600",
  sanat: "bg-pink-600",
  sağlık: "bg-teal-600",
  saglik: "bg-teal-600",
  eğitim: "bg-indigo-600",
  egitim: "bg-indigo-600",
  duyuru: "bg-amber-600",
  ajans: "bg-cyan-700",
}

export function tagColor(slug: string): string {
  return tagColors[slug] || "bg-gray-700"
}
