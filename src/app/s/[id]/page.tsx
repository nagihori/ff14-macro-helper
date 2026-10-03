import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { openShortLink } from '@/lib/share/short-link-store'
import { isShortId } from '@/lib/share/short-links'
import { buildEditorPath, encodeDocument } from '@/lib/share/url'

// 短縮共有 URL（/s/{id}）。保存した本文を、従来の共有 URL（/?m=…）へ転送する。
// 共有カードは転送先（トップの generateMetadata）が作るので、Discord などのクローラーも転送を追って同じカードを得る。
// 期限切れ・存在しない ID は、同階層の not-found.tsx の案内にする。
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ShortLinkPage({ params }: PageProps<'/s/[id]'>) {
  const { id } = await params
  if (!isShortId(id)) notFound()
  const link = await openShortLink(id)
  if (!link) notFound()
  const document = { version: 1 as const, body: link.body }
  redirect(link.originSlug ? buildEditorPath(document, link.originSlug) : `/?m=${encodeDocument(document)}`)
}
