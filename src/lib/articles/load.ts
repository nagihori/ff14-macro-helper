import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parseFrontmatter, type ArticleMeta } from './frontmatter'

// 記事（content/articles/*.md）を読む。ファイル名（拡張子なし）が URL の slug（/articles/{slug}）。
// content/drafts/ は下書き置き場で、ここでは読まない（公開されない）。
// 読めない記事（フロントマターの間違いなど）は、サイト全体を落とさず、理由をログに出して飛ばす。
export type Article = { slug: string; meta: ArticleMeta; body: string }

const DIR = path.join(process.cwd(), 'content', 'articles')
const FILE = /^([a-z0-9][a-z0-9-]*)\.md$/

let cache: Article[] | null = null

function read(): Article[] {
  let names: string[] = []
  try {
    names = readdirSync(DIR)
  } catch {
    return [] // content/articles が無い
  }
  const articles: Article[] = []
  for (const name of names) {
    const match = name.match(FILE)
    if (!match) continue
    const parsed = parseFrontmatter(readFileSync(path.join(DIR, name), 'utf-8'))
    if (!parsed.ok) {
      console.error(`[articles] ${name} を読めませんでした：${parsed.error}`)
      continue
    }
    articles.push({ slug: match[1], meta: parsed.meta, body: parsed.body })
  }
  // 新しい日付が先。同じ日付は slug 順。
  return articles.sort((a, b) => (a.meta.date < b.meta.date ? 1 : a.meta.date > b.meta.date ? -1 : a.slug.localeCompare(b.slug)))
}

// 本番はプロセスの中で 1 度だけ読む（記事の追加はデプロイで反映される）。開発では毎回読み直して、書いた内容がすぐ見えるようにする。
export function listArticles(): Article[] {
  if (process.env.NODE_ENV !== 'production') return read()
  return (cache ??= read())
}

export function getArticle(slug: string): Article | undefined {
  return listArticles().find((article) => article.slug === slug)
}
