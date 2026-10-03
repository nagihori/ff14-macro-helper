import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/PageHero'
import { listArticles } from '@/lib/articles/load'
import styles from './page.module.scss'

// 記事の一覧（/articles）。content/articles/*.md を新しい日付順に並べる。下書き（content/drafts/）は出ない。
// 記事が 1 本も無いあいだは、検索に載せない（フッターのリンクも出さない）。
export function generateMetadata(): Metadata {
  return { title: '記事', description: 'FFXIV マクロの作り方や小ネタ', robots: { index: listArticles().length > 0 } }
}

export default function ArticlesPage() {
  const articles = listArticles()
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <PageHero compact eyebrow="ARTICLES" title="記事" lead="FFXIV マクロの作り方や、ちょっとした小ネタ。" />
        {articles.length === 0 ? (
          <p className={styles.empty}>まだ記事はありません。</p>
        ) : (
          <ul className={styles.list}>
            {articles.map((article) => (
              <li key={article.slug} className={styles.item}>
                <p className={styles.meta}>
                  <time dateTime={article.meta.date}>{article.meta.date.replaceAll('-', '/')}</time>
                  {article.meta.tags.length > 0 && <span> ・ {article.meta.tags.map((tag) => `#${tag}`).join(' ')}</span>}
                </p>
                <h2 className={styles.title}><Link href={`/articles/${article.slug}`} className={styles.link}>{article.meta.title}</Link></h2>
                {article.meta.description && <p className={styles.description}>{article.meta.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
