import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import { toLogPreview } from '@/lib/macro/log-preview'
import { LogLegend } from './LogLegend'
import { LogList } from './LogList'
import styles from './MacroPreviewAccordion.module.scss'

const dictionary = getDictionary()

// 詳細ページのプレビュー（アコーディオン、初期は閉）。全行を一括で出す。
// 時刻は実時刻に展開せず、[HH:mm] の文字列のまま見せる（サーバーで作れて、開閉の状態も要らない）。
export function MacroPreviewAccordion({ body }: { body: string }) {
  const entries = toLogPreview(analyze(body, dictionary, { complete: true }).lines).map((entry) => ({ ...entry, timestamp: 'HH:mm' }))

  return (
    <details className={styles.preview}>
      <summary className={styles.summary}>動作プレビュー</summary>
      <div className={styles.body}>
        <LogList entries={entries} />
        <LogLegend entries={entries} />
        <p className={styles.note}>簡易的なプレビューです。ゲーム内で同じ結果になることは保証しません。</p>
      </div>
    </details>
  )
}
