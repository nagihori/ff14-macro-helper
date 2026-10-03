import Link from 'next/link'
import { ArticleMacroBar } from './ArticleMacroBar'
import { MacroCodeView } from './MacroCodeView'
import { findPublishedMacro } from '@/lib/published-macros/repository'
import { stripHtmlComments } from '@/lib/articles/comments'
import { renderMarkdown } from '@/lib/articles/markdown'
import { splitArticleBody } from '@/lib/articles/split'
import { buildEditorPath } from '@/lib/share/url'
import styles from './ArticleBody.module.scss'

// 記事の本文。Markdown の部分（lib/articles/markdown.ts で安全な HTML にする）と、
// マクロの埋め込み（本文に `::macro[slug]` だけの行を書く）を、順に並べる。
// マクロは iframe ではなく、このサイトの中でそのまま描く（速く、見た目がそろい、検索エンジンにも本文として読まれる）。
export async function ArticleBody({ body }: { body: string }) {
  // 下書きのメモ（<!-- … -->）は、記事に出さない。
  const segments = splitArticleBody(stripHtmlComments(body))
  const firstMacro = segments.findIndex((segment) => segment.type === 'macro')
  return (
    <div className={styles.body}>
      {segments.map((segment, index) =>
        segment.type === 'markdown' ? (
          <div key={index} className={styles.prose} dangerouslySetInnerHTML={{ __html: renderMarkdown(segment.text) }} />
        ) : (
          <ArticleMacro key={index} slug={segment.slug} hint={index === firstMacro} />
        ),
      )}
    </div>
  )
}

// 記事に埋め込んだ公開マクロ。見つからない（削除・公開停止・slug の間違い）ときは、記事全体を壊さず、小さな案内にする。
// hint：記事の最初の 1 つだけ、「コピーや編集ができる」ことを、1 行で知らせる（初めて読む人は、埋め込みが操作できると気づきにくい。
// 記事ごとに同じ文を書かなくてよいよう、自動で出す）。
async function ArticleMacro({ slug, hint }: { slug: string; hint: boolean }) {
  const macro = await findPublishedMacro(slug).catch(() => undefined)
  if (!macro) return <p className={styles.missing}>（埋め込んだマクロ「{slug}」は、いま表示できません）</p>
  return (
    <figure className={styles.macroFigure}>
      {hint && <p className={styles.hint}>この記事のマクロは、コピーして、ゲームで試せます。エディタで編集することもできます。</p>}
      <div className={styles.macro}>
        <figcaption className={styles.macroHead}>
          <Link href={`/macros/${macro.slug}`} className={styles.macroTitle}>{macro.title}</Link>
        </figcaption>
        <ArticleMacroBar body={macro.body} editHref={buildEditorPath({ version: 1, body: macro.body }, macro.slug)} />
        <MacroCodeView body={macro.body} />
      </div>
    </figure>
  )
}
