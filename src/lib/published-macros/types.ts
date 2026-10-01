// 公開ライブラリ用の最小モデル。URL 共有の本文データや将来のアカウントとは分離する。
// authorHandle は公開用の名前で、OAuth 側の ID・表示名は含めない（プライバシーポリシーの約束）。
export type PublishedMacro = {
  slug: string
  title: string
  description: string
  tags: string[]
  body: string
  authorHandle: string
  publishedAt: string // 'YYYY/MM/DD'（日本時間）
  arrangedFrom?: string // アレンジ元の slug
  reactions: { helpful: number; problem: number }
}
