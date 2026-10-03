import { macroFeedResponse } from '@/lib/feed/macro-feed'

// 新着の公開マクロの Atom フィード（/macros/feed.xml）。1 時間ごとに作り直す。
export const revalidate = 3600

export const GET = () => macroFeedResponse()
