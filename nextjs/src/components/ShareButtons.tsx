import Link from "next/link"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gunyayla.com.tr"

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `${SITE_URL}/haberler/${slug}`
  const encUrl = encodeURIComponent(url)
  const encTitle = encodeURIComponent(title)

  const links = [
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      label: "Facebook",
      color: "#1877f2",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/>
        </svg>
      ),
    },
    {
      href: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`,
      label: "X (Twitter)",
      color: "#000000",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z"/>
        </svg>
      ),
    },
    {
      href: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      label: "WhatsApp",
      color: "#25d366",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z"/>
        </svg>
      ),
    },
    {
      href: `https://t.me/share/url?url=${encUrl}&text=${encTitle}`,
      label: "Telegram",
      color: "#229ed9",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M11.94 0A11.94 11.94 0 0 0 0 11.94 11.94 11.94 0 0 0 11.94 24 11.94 11.94 0 0 0 24 11.94 11.94 11.94 0 0 0 11.94 0Zm5.73 8.11-1.97 9.3c-.15.66-.54.82-1.09.51l-3-2.22-1.45 1.4c-.16.16-.3.3-.61.3l.22-3.06 5.57-5.03c.24-.22-.05-.34-.38-.12l-6.88 4.33-2.96-.93c-.65-.2-.66-.65.14-.96l11.56-4.46c.53-.2 1 .13.85.94Z"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 mr-1">Paylaş:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${l.label} ile paylaş`}
          title={l.label}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white transition hover:opacity-80"
          style={{ background: l.color }}
        >
          {l.icon}
        </a>
      ))}
    </div>
  )
}
