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
  arrangedFrom?: { slug: string; title: string; deleted: boolean } // アレンジ元。削除済みならリンクを張らない（タイトルだけ示す）
  reactions: { helpful: number; problem: number }
  status: 'published' | 'suspended' // 一般向けの取得では常に 'published'。停止中は管理者向けの取得でだけ返る
}
