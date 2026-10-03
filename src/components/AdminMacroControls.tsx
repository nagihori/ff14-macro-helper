import { setMacroStatus } from '@/app/macros/[slug]/actions'
import { AdminDeleteControl } from './AdminDeleteControl'
import styles from './AdminMacroControls.module.scss'

// 詳細ページの管理者向け操作（公開停止／再公開）。表示は isAdmin で出し分けるが、実行可否はサーバーアクション側で再判定する。
export function AdminMacroControls({ slug, status }: { slug: string; status: 'published' | 'suspended' }) {
  const suspended = status === 'suspended'
  return (
    <section className={styles.box} aria-label="管理者操作">
      <p className={styles.label}>管理者操作</p>
      <div className={styles.row}>
        <p className={styles.status}>{suspended ? '公開停止中（一般の利用者には表示されません）' : '公開中'}</p>
        <form action={setMacroStatus.bind(null, slug, suspended ? 'published' : 'suspended')}>
          <button type="submit" className={styles.button}>{suspended ? '再公開する' : '公開を停止する'}</button>
        </form>
        {suspended && <AdminDeleteControl slug={slug} />}
      </div>
    </section>
  )
}
