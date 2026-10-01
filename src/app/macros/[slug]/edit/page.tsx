import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { AuthButton } from '@/components/AuthButton'
import { EditMacroForm } from '@/components/EditMacroForm'
import { findPublishedMacro, isMacroAuthor, listTags } from '@/lib/published-macros/repository'
import styles from '../../submit/page.module.scss'

export const metadata = { title: 'マクロを編集 | ff14-macro-helper' }

// 本人の公開中のマクロだけ編集できる。本人以外には存在を明かさない（404）。保存時にもサーバーアクションが再判定する。
export default async function EditMacroPage({ params }: PageProps<'/macros/[slug]/edit'>) {
  const { slug } = await params
  const session = await auth()
  if (!session) return <div className={styles.page}><AuthButton redirectTo={`/macros/${slug}/edit`} /></div>
  const macro = await findPublishedMacro(slug)
  if (!macro || !(await isMacroAuthor(slug, session.user.id))) notFound()
  const tagSuggestions = await listTags()
  return (
    <div className={styles.page}>
      <EditMacroForm slug={slug} initial={{ title: macro.title, description: macro.description, tags: macro.tags }} tagSuggestions={tagSuggestions} />
    </div>
  )
}
