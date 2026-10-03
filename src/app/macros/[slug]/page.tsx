import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AdminMacroControls } from '@/components/AdminMacroControls'
import { ActionButton } from '@/components/ActionButton'
import { ActionGroup } from '@/components/ActionGroup'
import { CopyMacroButton } from '@/components/CopyMacroButton'
import { EditIcon } from '@/components/icons'
import { MacroCardSection } from '@/components/MacroCardSection'
import { MacroCodeBar } from '@/components/MacroCodeBar'
import { MacroCodeView } from '@/components/MacroCodeView'
import { MacroPreviewAccordion } from '@/components/MacroPreviewAccordion'
import { ShareMacroButton } from '@/components/ShareMacroButton'
import { OwnerMacroControls } from '@/components/OwnerMacroControls'
import { PublishedMacroReactions } from '@/components/PublishedMacroReactions'
import { withDescriptionParts } from '@/lib/published-macros/resolve-descriptions'
import { descriptionToPlainText } from '@/lib/published-macros/description-links'
import { MacroDescription } from '@/components/MacroDescription'
import { findDerivedMacros, findMacroForViewer, findPublishedMacro, findRelatedMacros, isMacroAuthor } from '@/lib/published-macros/repository'
import { getDictionary } from '@/lib/commands/dictionary'
import { toLodestoneBBCode } from '@/lib/share/lodestone'
import { buildEditorPath } from '@/lib/share/url'
import { BRAND_NAME } from '@/lib/site-config'
import { getSiteUrl } from '@/lib/site-url'
import { UI_TEXT } from '@/lib/ui-text'
import styles from './page.module.scss'

// 共有時の title / description / OGP。公開中のマクロだけ中身を出し、停止中などは共通の表示にして検索にも載せない。
// OGP 画像は同じ階層の opengraph-image.tsx が生成する（Next.js が og:image を自動で付ける）。
export async function generateMetadata({ params }: PageProps<'/macros/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const macro = await findPublishedMacro(slug)
  if (!macro) return { title: '公開マクロ', robots: { index: false } }
  const lines = macro.body.split('\n').length
  const [described] = await withDescriptionParts([macro])
  const plain = descriptionToPlainText(described.descriptionParts ?? [])
  const description = plain || `FFXIV マクロ（${lines} 行）${macro.tags.length > 0 ? ' ' + macro.tags.map((tag) => `#${tag}`).join(' ') : ''}`
  // 詳細ページだけ「{マクロタイトル} « {BRAND_NAME}」。layout のテンプレートは通さない。
  const title = `${macro.title} « ${BRAND_NAME}`
  return {
    title: { absolute: title },
    description,
    openGraph: { type: 'article', siteName: BRAND_NAME, locale: 'ja_JP', title, description, url: `/macros/${slug}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PublishedMacroPage({ params }: PageProps<'/macros/[slug]'>) {
  const { slug } = await params
  // 停止中のマクロは、管理者と投稿者本人にだけ見せる。操作（再公開）の許可そのものはサーバーアクション側で判定する。
  const user = (await auth())?.user
  const admin = user?.isAdmin === true
  const macro = await findMacroForViewer(slug, user && { id: user.id, isAdmin: admin })
  if (!macro) notFound()
  const origin = macro.arrangedFrom
  const editHref = buildEditorPath({ version: 1, body: macro.body }, macro.slug)
  const lodestoneBBCode = macro.status === 'published' ? toLodestoneBBCode({ title: macro.title, body: macro.body, url: `${getSiteUrl()}/macros/${macro.slug}`, brand: BRAND_NAME }, getDictionary()) : null
  const [relatedRaw, derivedRaw, mine] = await Promise.all([findRelatedMacros(slug), findDerivedMacros(slug), user ? isMacroAuthor(slug, user.id) : false])
  // 説明内の他マクロの URL をタイトルへ展開する（URL が無ければ DB には触らない）。似た・派生マクロのカードは全体がリンクなので、タイトルだけの文字にする。
  const [[described], related, derived] = await Promise.all([withDescriptionParts([macro]), withDescriptionParts(relatedRaw), withDescriptionParts(derivedRaw)])

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/macros" className={styles.backLink}>← 公開マクロ一覧に戻る</Link>
        {macro.status === 'suspended' && <p role="status" className={styles.suspendedNotice}>{admin ? 'このマクロは公開停止中です。管理者と投稿者にだけ表示されています。' : <>このマクロは運営により公開停止されています。あなたにだけ表示されています。心当たりがない場合や再公開のご希望は、<Link href="/terms#contact" className={styles.originLink}>利用規約の連絡先</Link>からご連絡ください。</>}</p>}
        <article className={styles.article}>
          <div className={styles.tags}>
            {macro.tags.map((tag) => (
              <Link key={tag} href={`/macros?q=${encodeURIComponent(`#${tag}`)}`} className={styles.tag}>#{tag}</Link>
            ))}
          </div>
          <h1 className={styles.title}>{macro.title}</h1>
          <p className={styles.description}><MacroDescription description={macro.description} parts={described.descriptionParts} linkClassName={styles.descriptionLink} /></p>
          <section className={styles.bodySection}>
            <h2 className={styles.bodyHeading}>マクロ本文</h2>
            <div className={styles.codeBlock}>
              <MacroCodeBar body={macro.body} editHref={editHref} title={macro.title} path={`/macros/${macro.slug}`} canShare={macro.status === 'published'} />
              <MacroCodeView body={macro.body} />
            </div>
            <MacroPreviewAccordion body={macro.body} />
            <p className={styles.disclaimer}>ゲーム内の動作を保証するものではありません。</p>
          </section>
          <ActionGroup className={styles.actions}>
            <CopyMacroButton text={macro.body} />
            <ActionButton icon={<EditIcon />} variant="secondary" href={editHref}>{UI_TEXT.editInEditor}</ActionButton>
            {macro.status === 'published' && <ShareMacroButton title={macro.title} path={`/macros/${macro.slug}`} lodestoneBBCode={lodestoneBBCode ?? undefined} />}
          </ActionGroup>
          <section className={styles.reactions}>
            <PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} />
          </section>
          {mine && <OwnerMacroControls slug={macro.slug} canEdit={macro.status === 'published'} />}
          {admin && <AdminMacroControls slug={macro.slug} status={macro.status} />}
          <footer className={styles.meta}>
            投稿者 {macro.authorHandle} · {macro.publishedAt}
            {origin && (origin.deleted ? <> · アレンジ元：{origin.title}（削除済み）</> : <> · アレンジ元：<Link href={`/macros/${origin.slug}`} className={styles.originLink}>{origin.title}</Link></>)}
          </footer>
        </article>
        <MacroCardSection id="derived-heading" heading="このマクロから派生" items={derived} />
        <MacroCardSection id="related-heading" heading="似たマクロ" items={related} />
      </div>
    </main>
  )
}
