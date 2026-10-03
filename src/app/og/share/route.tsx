import { macroCardImage } from '@/lib/og/macro-card'
import { decodeDocument } from '@/lib/share/url'

// 共有 URL（/?m=…）の共有カード。URL の中のマクロを、その場で描く（DB は読まない）。
// 同じ m なら同じ画像なので、CDN に長く持たせる。m が壊れている・長すぎる場合は、名前と羽ペンだけのカード。
const MAX_PARAM_LENGTH = 12000
const CACHE = { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' }

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get('m') ?? ''
  const decoded = param.length <= MAX_PARAM_LENGTH ? decodeDocument(param) : null
  if (!decoded || !decoded.ok) return macroCardImage({ body: null, headers: { 'Cache-Control': 'public, max-age=3600' } })
  const lines = decoded.document.body.split('\n').length
  return macroCardImage({ title: `共有されたマクロ（${lines} 行）`, body: decoded.document.body, headers: CACHE })
}
