import { auth } from '@/auth'
import { AuthButton } from '@/components/AuthButton'
import { PublishFromUrlForm } from '@/components/PublishFromUrlForm'
import { listPublishedMacros, listTags } from '@/lib/published-macros/repository'
import { getUserHandle } from '@/lib/published-macros/store'
import styles from './page.module.scss'

export const metadata = { title: '共有URLから投稿' }

export default async function PublishMacroPage({ searchParams }: PageProps<'/macros/submit'>) {
  const { url } = await searchParams
  const shareUrl = typeof url === 'string' ? url : ''
  const session = await auth()
  const [tags, macros, savedHandle] = await Promise.all([listTags(), listPublishedMacros(), session ? getUserHandle(session.user.id) : null])
  // ログイン後に、共有URLを入れたこのページへ戻す。
  const here = shareUrl ? `/macros/submit?url=${encodeURIComponent(shareUrl)}` : '/macros/submit'
  return (
    <div className={styles.page}>
      <PublishFromUrlForm
        initialShareUrl={shareUrl}
        tagSuggestions={tags}
        knownMacros={macros.map(({ slug, title }) => ({ slug, title }))}
        savedHandle={savedHandle}
        loginSlot={session ? undefined : <AuthButton redirectTo={here} />}
      />
    </div>
  )
}
