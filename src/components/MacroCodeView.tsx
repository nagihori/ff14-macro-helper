import { getDictionary } from '@/lib/commands/dictionary'
import { analyze } from '@/lib/macro/analyze'
import { buildHighlight } from '@/lib/macro/highlight'
import styles from './MacroCodeView.module.scss'

const dictionary = getDictionary()

// 詳細ページのコード本文。エディタと同じ解析結果（buildHighlight）で色分けする読み取り専用の表示。
// 警告の波線や背景は付けない（色分けだけ）。セグメントを連結すると本文に戻るので、選択コピーでも余計な文字は混ざらない。
export function MacroCodeView({ body, className }: { body: string; className?: string }) {
  const { lines } = analyze(body, dictionary, { complete: true })
  const highlight = buildHighlight(lines, dictionary)

  return (
    <pre className={[styles.code, className].filter(Boolean).join(' ')}>
      {highlight.map((line, index) => (
        <span key={line.line}>
          {index > 0 && '\n'}
          {line.segments.map((segment, segmentIndex) => (
            <span key={segmentIndex} data-kind={segment.kind}>{segment.text}</span>
          ))}
        </span>
      ))}
    </pre>
  )
}
