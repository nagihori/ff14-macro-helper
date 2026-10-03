import { ImageResponse } from 'next/og'
import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import { buildHighlight } from '@/lib/macro/highlight'
import { halfWidthLength } from '@/lib/macro/text-width'
import type { HighlightSegment, HighlightSegmentKind } from '@/lib/macro/types'
import { BRAND_ICON_DATA_URL } from '@/lib/og/brand-icon'
import { loadFont } from '@/lib/og/font'
import { findPublishedMacro } from '@/lib/published-macros/repository'
import { BRAND_NAME } from '@/lib/site-config'

// 公開マクロの共有カード（OGP 画像）。マクロの冒頭をシンタックスハイライトつきで見せる、ミニマルな道具の顔。
// 公開中のマクロだけ中身を描き、それ以外はブランドだけのカードにする。
export const alt = `公開マクロ | ${BRAND_NAME}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#14161c'
const PANEL = '#0d0f14'
const LINE = '#2a2e38'
const TEXT = '#f2f3f5'
const MUTED = '#8a8f9a'
const ACCENT = '#eb0949' // ブランドの赤（favicon）
const AMBER = '#fbbf24' // ダークテーマの差し色（タグ）

// エディタのハイライト（styles/_mixins.scss の $highlight-tones）の、暗い背景用の色。
const TOKEN_COLORS: Partial<Record<HighlightSegmentKind, string>> = {
  'command-known': '#60a5fa',
  'command-known-emote': '#2dd4bf',
  'command-unknown': '#fbbf24',
  'arg-placeholder': '#c084fc',
  'arg-placeholder-wait': '#f472b6',
  'arg-placeholder-invalid': '#f87171',
  'arg-string': '#34d399',
  'arg-number': '#2dd4bf',
}

const CODE_LINES = 4 // カードに出す行数
const CODE_WIDTH = 46 // 1 行に収める幅（半角換算。全角は 2）

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value)

// 1 行のセグメントを、半角換算の幅に収める（超えたら末尾を … にする）。
function clipSegments(segments: HighlightSegment[], maxWidth: number): HighlightSegment[] {
  const result: HighlightSegment[] = []
  let used = 0
  for (const segment of segments) {
    let text = ''
    for (const char of segment.text) {
      const width = halfWidthLength(char)
      if (used + width > maxWidth - 1) {
        result.push({ ...segment, text: text + '…' })
        return result
      }
      text += char
      used += width
    }
    result.push({ ...segment, text })
  }
  return result
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const macro = await findPublishedMacro(slug)

  const title = macro ? clip(macro.title, 44) : BRAND_NAME
  const tags = macro ? macro.tags.slice(0, 4).map((tag) => `#${tag}`) : []
  const author = macro ? `投稿者 ${macro.authorHandle}` : ''
  const allLines = macro ? buildHighlight(analyze(macro.body, getDictionary(), { complete: true }).lines, getDictionary()) : []
  const codeLines = allLines.slice(0, CODE_LINES).map((line) => clipSegments(line.segments, CODE_WIDTH))
  const more = allLines.length > CODE_LINES ? `… 全 ${allLines.length} 行` : ''

  const drawn = `${BRAND_NAME}${title}${tags.join('')}${author}${more}${codeLines.map((line) => line.map((segment) => segment.text).join('')).join('')}`
  const font = await loadFont(drawn)
  // フォントが取れなかったときは、文字化けする日本語を描かない。
  const showText = font !== null || /^[\x20-\x7e]*$/.test(drawn)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: BG, color: TEXT, padding: '52px 64px', fontFamily: font ? 'Noto Sans JP' : 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND_ICON_DATA_URL} width={64} height={64} alt="" style={{ borderRadius: 14 }} />
          {/* マクロが無いカードでは、名前が大きなタイトルとして出るので、ここでは繰り返さない。 */}
          {macro && <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#c9ccd3' }}>{showText ? BRAND_NAME : 'macro'}</div>}
        </div>

        {showText && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: title.length > 24 ? 50 : 64, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
            {codeLines.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32, padding: '24px 32px', background: PANEL, border: `2px solid ${LINE}`, borderLeft: `8px solid ${ACCENT}`, borderRadius: 16, fontSize: 28, lineHeight: 1.5 }}>
                {codeLines.map((segments, index) => (
                  <div key={index} style={{ display: 'flex', whiteSpace: 'pre', minHeight: 42 }}>
                    {segments.map((segment, i) => <span key={i} style={{ color: TOKEN_COLORS[segment.kind] ?? '#e4e4e7' }}>{segment.text}</span>)}
                  </div>
                ))}
                {more && <div style={{ display: 'flex', color: MUTED }}>{more}</div>}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26 }}>
          <div style={{ display: 'flex', gap: 20, color: AMBER }}>{showText && tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div style={{ display: 'flex', color: MUTED }}>{showText ? author : ''}</div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: 'Noto Sans JP', data: font, style: 'normal', weight: 700 }] : undefined },
  )
}
