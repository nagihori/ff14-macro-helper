import Link from 'next/link'
import { MacroCodeView } from './MacroCodeView'
import { findPublishedMacro } from '@/lib/published-macros/repository'
import { renderMarkdown } from '@/lib/articles/markdown'
import { splitArticleBody } from '@/lib/articles/split'
import { buildEditorPath } from '@/lib/share/url'
import styles from './ArticleBody.module.scss'

// 記事の本文。Markdown の部分（lib/articles/markdown.ts で安全な HTML にする）と、
// マクロの埋め込み（本文に `::macro[slug]` だけの行を書く）を、順に並べる。
// マクロは iframe ではなく、このサイトの中でそのまま描く（速く、見た目がそろい、検索エンジンにも本文として読まれる）。
export async function ArticleBody({ body }: { body: string }) {
  const segments = splitArticleBody(body)
  return (
    <div className={styles.body}>
      {segments.map((segment, index) =>
        segment.type === 'markdown' ? (
          <div key={index} className={styles.prose} dangerouslySetInnerHTML={{ __html: renderMarkdown(segment.text) }} />
        ) : (
          <ArticleMacro key={index} slug={segment.slug} />
        ),
      )}
    </div>
  )
}

// 記事に埋め込んだ公開マクロ。見つからない（削除・公開停止・slug の間違い）ときは、記事全体を壊さず、小さな案内にする。
async function ArticleMacro({ slug }: { slug: string }) {
  const macro = await findPublishedMacro(slug).catch(() => undefined)
  if (!macro) return <p className={styles.missing}>（埋め込んだマクロ「{slug}」は、いま表示できません）</p>
  return (
    <figure className={styles.macro}>
      <figcaption className={styles.macroHead}>
        <Link href={`/macros/${macro.slug}`} className={styles.macroTitle}>{macro.title}</Link>
        <Link href={buildEditorPath({ version: 1, body: macro.body }, macro.slug)} className={styles.macroEdit}>エディタで編集</Link>
      </figcaption>
      <MacroCodeView body={macro.body} />
    </figure>
  )
}
