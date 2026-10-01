// 動作確認用のサンプル 3 件を入れる。slug が既にあれば何もしない（何度流してもよい）。
// 使い方: node --env-file=.env.local scripts/seed-samples.mjs
import { neon } from '@neondatabase/serverless'

const samples = [
  { slug: 'party-ready-check', title: 'コンテンツ開始前の確認', description: 'パーティの準備確認を短く呼びかけるためのチャットマクロです。', tags: ['パーティ', 'チャット'], body: '/p 準備確認をお願いします！\n/p 準備ができたら「ready」でお願いします。', author: 'Moco', at: '2026-09-22', helpful: 28, problem: 0 },
  { slug: 'gathering-location-callout', title: '採集場所の案内', description: 'フリーカンパニーやリンクシェルで座標を共有するときの定型文です。', tags: ['採集', 'チャット'], body: '/fc 次の集合場所は <pos> です。\n/fc テレポ後に現地で合流しましょう。', author: 'Haru', at: '2026-09-18', helpful: 12, problem: 1 },
  { slug: 'crafting-start-notice', title: '製作開始のお知らせ', description: '作業開始と待機の目安を伝える、募集・共同作業向けのシンプルなマクロです。', tags: ['クラフター', '募集'], body: '/sh 製作を開始します。\n/wait 3\n/sh ご協力ありがとうございます！', author: 'Nono', at: '2026-09-15', helpful: 8, problem: 0 },
]

const sql = neon(process.env.DATABASE_URL)
for (const s of samples) {
  const rows = await sql.query(
    `insert into macros (slug, title, description, body, tags, author_handle, published_at, helpful_count, problem_count)
     values ($1, $2, $3, $4, $5, $6, ($7::date)::timestamp at time zone 'Asia/Tokyo', $8, $9)
     on conflict (slug) do nothing returning slug`,
    [s.slug, s.title, s.description, s.body, s.tags, s.author, s.at, s.helpful, s.problem],
  )
  console.log(rows.length ? 'inserted' : 'skipped ', s.slug)
}
