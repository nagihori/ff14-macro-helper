import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArticleBody } from '@/components/ArticleBody'
import { ArticleCta } from '@/components/ArticleCta'
import { getArticle, listArticles } from '@/lib/articles/load'
import { BRAND_NAME } from '@/lib/site-config'
import styles from './page.module.scss'

// 記事の個別ページ（/articles/{slug}）。content/articles/{slug}.md を、ビルド時に作る。
export function generateStaticParams() {
  return listArticles().map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: PageProps<'/articles/[slug]'>): Promise<Metadata> {
  const article = getArticle((await params).slug)
  if (!article) return { title: '記事', robots: { index: false } }
  const { title, description, date } = article.meta
  const full = `${title} « ${BRAND_NAME}`
  return {
    title: { absolute: full },
    description: description || undefined,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: { type: 'article', siteName: BRAND_NAME, locale: 'ja_JP', title: full, description: description || undefined, url: `/articles/${article.slug}`, publishedTime: date },
    twitter: { card: 'summary_large_image', title: full, description: description || undefined },
  }
}

export default async function ArticlePage({ params }: PageProps<'/articles/[slug]'>) {
  const article = getArticle((await params).slug)
  if (!article) notFound()
  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Link href="/articles" className={styles.backLink}>← 記事の一覧</Link>
        <p className={styles.meta}>
          <time dateTime={article.meta.date}>{article.meta.date.replaceAll('-', '/')}</time>
          {article.meta.tags.length > 0 && <span> ・ {article.meta.tags.map((tag) => `#${tag}`).join(' ')}</span>}
        </p>
        <h1 className={styles.title}>{article.meta.title}</h1>
        {article.meta.description && <p className={styles.lead}>{article.meta.description}</p>}
        <ArticleBody body={article.body} />
        <ArticleCta />
      </article>
    </main>
  )
}
