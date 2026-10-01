import { PublishFromUrlForm } from '@/components/PublishFromUrlForm'
import styles from './page.module.scss'

export const metadata = { title: '共有 URL から公開 | ff14-macro-helper' }

export default function PublishMacroPage() {
  return <div className={styles.page}><PublishFromUrlForm /></div>
}
