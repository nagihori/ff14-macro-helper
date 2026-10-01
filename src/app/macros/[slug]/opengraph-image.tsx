import { ImageResponse } from 'next/og'
import { BRAND_NAME } from '@/lib/site-config'
import { findPublishedMacro } from '@/lib/published-macros/repository'

// 公開マクロの共有カード（OGP 画像）。公開中のマクロだけ中身を描き、それ以外は共通のカードにする。
export const alt = `公開マクロ | ${BRAND_NAME}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE = BRAND_NAME

// 日本語フォントは同梱せず（ImageResponse の 500KB 上限のため）、描く文字だけの部分集合を Google Fonts から取る。
// 取得に失敗したら null を返し、日本語を含まない最低限のカードにする。
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`)).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!url) return null
    const res = await fetch(url)
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value)

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const macro = await findPublishedMacro(slug)

  const title = macro ? macro.title : SITE
  const description = macro ? clip(macro.description || 'FFXIV マクロ', 90) : ''
  const tags = macro ? macro.tags.slice(0, 5).map((tag) => `#${tag}`) : []
  const footer = macro ? `投稿者 ${macro.authorHandle}　${SITE}` : SITE

  const font = await loadFont(`${title}${description}${tags.join('')}${footer}`)
  // フォントが取れなかったときは、文字化けする日本語を描かない。
  const showText = font !== null || /^[\x20-\x7e]*$/.test(`${title}${description}${footer}`)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#14161c', color: '#f2f3f5', padding: 72, fontFamily: font ? 'Noto Sans JP' : 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {showText && <div style={{ display: 'flex', fontSize: title.length > 28 ? 52 : 68, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>}
          {showText && description && <div style={{ display: 'flex', marginTop: 28, fontSize: 32, lineHeight: 1.5, color: '#b8bcc6' }}>{description}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {showText && tags.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 28, fontSize: 28, color: '#8fb4ff' }}>{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          <div style={{ display: 'flex', fontSize: 26, color: '#8a8f9a', borderTop: '2px solid #2a2e38', paddingTop: 24 }}>{showText ? footer : SITE}</div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: 'Noto Sans JP', data: font, style: 'normal', weight: 700 }] : undefined },
  )
}
