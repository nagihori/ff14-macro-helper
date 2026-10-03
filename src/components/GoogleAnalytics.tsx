'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

declare global {
  interface Window { dataLayer?: unknown[] }
}

// gtag.js は Arguments オブジェクトを積む決まりなので、アロー関数ではなく function で書く。
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 引数は arguments 経由で積む
function gtag(..._args: unknown[]) {
  // eslint-disable-next-line prefer-rest-params -- gtag の規約（Arguments を dataLayer へ積む）
  ;(window.dataLayer ??= []).push(arguments)
}

// Google アナリティクス 4。測定 ID があるとき（本番）だけ layout が描画する。
// 共有URL（?m=）にはマクロ本文が入るため、送る page_location はクエリを落とした「origin + パス」だけにする。
// 自動のページビューは止めて、ルート遷移ごとに自分で送る（遷移後も同じ規則でクエリを落とすため）。
// 広告向けの機能（Google シグナル・広告パーソナライズ）は使わない。
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()

  useEffect(() => {
    gtag('event', 'page_view', { page_location: `${window.location.origin}${pathname}`, page_path: pathname })
  }, [pathname])

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});`}</Script>
    </>
  )
}
