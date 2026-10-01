// 公開ライブラリ用の最小モデル。URL 共有の本文データや将来のアカウントとは分離する。
export type PublishedMacro = { slug: string; title: string; description: string; tags: string[]; body: string; authorHandle: string; publishedAt: string; arrangedFrom?: string; reactions: { helpful: number; problem: number } }

export const samplePublishedMacros: PublishedMacro[] = [
  { slug: 'party-ready-check', title: 'コンテンツ開始前の確認', description: 'パーティの準備確認を短く呼びかけるためのチャットマクロです。', tags: ['パーティ', 'チャット'], body: '/p 準備確認をお願いします！\n/p 準備ができたら「ready」でお願いします。', authorHandle: 'Moco', publishedAt: '2026/09/22', reactions: { helpful: 28, problem: 0 } },
  { slug: 'gathering-location-callout', title: '採集場所の案内', description: 'フリーカンパニーやリンクシェルで座標を共有するときの定型文です。', tags: ['採集', 'チャット'], body: '/fc 次の集合場所は <pos> です。\n/fc テレポ後に現地で合流しましょう。', authorHandle: 'Haru', publishedAt: '2026/09/18', reactions: { helpful: 12, problem: 1 } },
  { slug: 'crafting-start-notice', title: '製作開始のお知らせ', description: '作業開始と待機の目安を伝える、募集・共同作業向けのシンプルなマクロです。', tags: ['クラフター', '募集'], body: '/sh 製作を開始します。\n/wait 3\n/sh ご協力ありがとうございます！', authorHandle: 'Nono', publishedAt: '2026/09/15', reactions: { helpful: 8, problem: 0 } },
]

// URL の動的セグメントから投稿を引く入口。将来はこの関数を DB 取得へ差し替える。
export function findPublishedMacro(slug: string) { return samplePublishedMacros.find((macro) => macro.slug === slug) }

// 似たマクロ：共通タグの数が多い順（同数なら新しい順）に最大 limit 件。共通タグがないものは含めない。
export function findRelatedMacros(slug: string, limit = 3) {
  const base = findPublishedMacro(slug)
  if (!base) return []
  return samplePublishedMacros
    .filter((macro) => macro.slug !== slug)
    .map((macro) => ({ macro, shared: macro.tags.filter((tag) => base.tags.includes(tag)).length }))
    .filter((item) => item.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.macro.publishedAt.localeCompare(a.macro.publishedAt))
    .slice(0, limit)
    .map((item) => item.macro)
}
