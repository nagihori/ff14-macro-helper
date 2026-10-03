import { macroFeedResponse } from '@/lib/feed/macro-feed'

// タグ別の新着フィード（/macros/tag/[tag]/feed.xml）。1 時間ごとに作り直す。
export const revalidate = 3600

// URL のタグを文字列へ戻す（タグ別一覧ページと同じ。Next が先にデコードしている場合は、そのまま使う）。
function readTag(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export async function GET(_request: Request, { params }: RouteContext<'/macros/tag/[tag]/feed.xml'>) {
  return macroFeedResponse(readTag((await params).tag))
}
