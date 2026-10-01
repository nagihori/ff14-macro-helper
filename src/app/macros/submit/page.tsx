import { PublishFromUrlForm } from '@/components/PublishFromUrlForm'
import { listPublishedMacros, listTags } from '@/lib/published-macros/repository'
import styles from './page.module.scss'

export const metadata = { title: '共有 URL から公開 | ff14-macro-helper' }

export default async function PublishMacroPage({ searchParams }: PageProps<'/macros/submit'>) {
  const { url } = await searchParams
  const [tags, macros] = await Promise.all([listTags(), listPublishedMacros()])
  return <div className={styles.page}><PublishFromUrlForm initialShareUrl={typeof url === 'string' ? url : ''} tagSuggestions={tags} knownMacros={macros.map(({ slug, title }) => ({ slug, title }))} /></div>
}
