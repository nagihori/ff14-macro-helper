import { ImageResponse } from 'next/og'
import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import { buildHighlight } from '@/lib/macro/highlight'
import { halfWidthLength } from '@/lib/macro/text-width'
import type { HighlightSegment, HighlightSegmentKind } from '@/lib/macro/types'
import { BRAND_GLYPH_VIEWBOX, brandGlyphDataUrl } from '@/lib/og/brand-glyph'
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
const PANEL = 'rgba(14, 16, 21, 0.78)' // 半透明。後ろの羽ペンが暗く透ける
const LINE = '#2a2e38'
const TEXT = '#f2f3f5'
const MUTED = '#8a8f9a'
const ACCENT = '#cf3050' // ブランドの赤（favicon）を少し落ち着かせた色
const AMBER = '#f0b72b' // ダークテーマの差し色（タグ）
const GLYPH = '#f4dd4b' // 羽ペンの黄色（favicon）

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

const CODE_LINES = 5 // カードに出す行数
const CODE_WIDTH = 40 // 1 行に収める幅（半角換算。全角は 2）

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
  const allLines = macro ? buildHighlight(analyze(macro.body, getDictionary(), { complete: true }).lines, getDictionary()) : []
  const codeLines = allLines.slice(0, CODE_LINES).map((line) => clipSegments(line.segments, CODE_WIDTH))
  const more = allLines.length > CODE_LINES ? `… 全 ${allLines.length} 行` : ''

  const drawn = `${BRAND_NAME}${title}${tags.join('')}${more}${codeLines.map((line) => line.map((segment) => segment.text).join('')).join('')}`
  const font = await loadFont(drawn)
  // フォントが取れなかったときは、文字化けする日本語を描かない。
  const showText = font !== null || /^[\x20-\x7e]*$/.test(drawn)

  // 羽ペンは大きく右に置き、コードのパネルを半透明で重ねる（パネルの外は明るく、重なる所は暗く透ける）。
  const glyphHeight = 440
  const glyphWidth = Math.round((glyphHeight * BRAND_GLYPH_VIEWBOX.width) / BRAND_GLYPH_VIEWBOX.height)

  return new ImageResponse(
    (
      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BG, color: TEXT, padding: '48px 84px 44px', fontFamily: font ? 'Noto Sans JP' : 'sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandGlyphDataUrl(GLYPH)} width={glyphWidth} height={glyphHeight} alt="" style={{ position: 'absolute', right: 30, top: 96, opacity: 0.92 }} />

        {/* マクロが無いカード（停止中・存在しない）は、名前を大きく中央寄りに出し、右下の名前は繰り返さない。 */}
        {showText && <div style={{ display: 'flex', fontSize: macro ? (title.length > 24 ? 46 : 56) : 76, fontWeight: 700, lineHeight: 1.25, marginLeft: 12, marginTop: macro ? 0 : 190 }}>{title}</div>}

        {showText && codeLines.length > 0 && (
          // 左の赤い帯は、枠の角丸で切り抜く（border-left だと角に斜めの継ぎ目が出る）。
          <div style={{ display: 'flex', marginTop: 28, background: PANEL, border: `2px solid ${LINE}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45)' }}>
            <div style={{ display: 'flex', width: 34, background: ACCENT }} />
            <div style={{ display: 'flex', flexDirection: 'column', padding: '26px 36px', fontSize: 28, lineHeight: 1.5 }}>
              {codeLines.map((segments, index) => (
                <div key={index} style={{ display: 'flex', whiteSpace: 'pre', minHeight: 42 }}>
                  {segments.map((segment, i) => <span key={i} style={{ color: TOKEN_COLORS[segment.kind] ?? '#e4e4e7' }}>{segment.text}</span>)}
                </div>
              ))}
              {more && <div style={{ display: 'flex', color: MUTED }}>{more}</div>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 24, marginLeft: 46, fontSize: 28, fontWeight: 700, color: AMBER }}>{showText && tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          {macro && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, fontWeight: 700, color: '#c9ccd3' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={BRAND_ICON_DATA_URL} width={48} height={48} alt="" style={{ borderRadius: 11 }} />
              {showText ? BRAND_NAME : ''}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: 'Noto Sans JP', data: font, style: 'normal', weight: 700 }] : undefined },
  )
}
