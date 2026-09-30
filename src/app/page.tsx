import Link from 'next/link'
import { MacroWorkbench } from '@/components/MacroWorkbench'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <header className="flex w-full max-w-5xl items-start justify-between gap-6 px-8 pt-8">
        <div><h1 className="text-xl font-semibold text-black dark:text-zinc-50">ff14-macro-helper</h1><p className="text-sm text-zinc-500">FFXIV マクロの編集・診断・ログプレビュー・共有をブラウザ内で完結します。</p></div>
        <Link href="/macros" className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-500 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900">公開マクロを探す</Link>
      </header>
      <MacroWorkbench />
    </div>
  )
}
