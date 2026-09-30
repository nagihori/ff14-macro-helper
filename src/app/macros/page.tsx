import Link from 'next/link'
import { PublishedMacroLibrary } from '@/components/PublishedMacroLibrary'

export const metadata = { title: '公開マクロ | ff14-macro-helper' }

export default async function MacroLibraryPage({ searchParams }: PageProps<'/macros'>) {
  const { q } = await searchParams
  const initialQuery = typeof q === 'string' ? q : ''
  return <div className="min-h-screen bg-stone-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"><header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10"><Link href="/" className="text-sm font-bold">ff14-macro-helper</Link><Link href="/" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">エディタに戻る</Link></header><PublishedMacroLibrary initialQuery={initialQuery} /></div>
}
