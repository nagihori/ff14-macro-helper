import Link from 'next/link'
import type { DescriptionPart } from '@/lib/published-macros/description-links'

// 説明文。自サイトのマクロ URL は、タイトルのリンクに展開済みの descriptionParts で描く。
// 展開前のデータ（parts が無い）は、書かれた文字列をそのまま出す。
export function MacroDescription({ description, parts, linkClassName }: { description: string; parts?: DescriptionPart[]; linkClassName?: string }) {
  if (!parts) return <>{description}</>
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'link') return <Link key={index} href={`/macros/${part.slug}`} className={linkClassName}>{part.title}</Link>
        if (part.type === 'deleted') return <span key={index}>{part.title}（削除済み）</span>
        if (part.type === 'macro') return <span key={index}>{part.raw}</span>
        return <span key={index}>{part.text}</span>
      })}
    </>
  )
}
