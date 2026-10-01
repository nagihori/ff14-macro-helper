import { useSyncExternalStore } from 'react'
import { useCopyFeedback } from './useCopyFeedback'

const subscribeNothing = () => () => {}

// 詳細ページの共有。タッチ操作の端末（スマホ・タブレット）で共有に対応していれば OS の共有シートを開く。
// それ以外（PC など）は、シートを開かずこのページの URL をコピーする（PC の共有シートは出口が少なく、コピーしたいだけの人には遠回りなので）。
// 共有されるのは詳細ページの URL で、クエリは含めない。
export function useShareUrl(title: string, path: string) {
  const { state, run } = useCopyFeedback()
  // 描画時点では（サーバーと揃えるため）コピー扱い。マウント後に端末を見て、共有シートを使う端末なら文言を切り替える。
  const usesShareSheet = useSyncExternalStore(
    subscribeNothing,
    () => typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches,
    () => false,
  )

  async function share() {
    const url = new URL(path, window.location.origin).toString()
    if (usesShareSheet) {
      try {
        await navigator.share({ title, url })
      } catch {
        // 共有シートを閉じただけ（AbortError）などは何もしない
      }
      return
    }
    await run(() => navigator.clipboard.writeText(url))
  }

  return { state, share, usesShareSheet }
}
