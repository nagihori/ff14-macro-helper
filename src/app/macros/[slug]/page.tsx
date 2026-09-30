import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublishedMacroReactions } from '@/components/PublishedMacroReactions'
import { findPublishedMacro, samplePublishedMacros } from '@/lib/published-macros/sample-data'
import { encodeDocument } from '@/lib/share/url'

export function generateStaticParams() { return samplePublishedMacros.map((macro) => ({ slug: macro.slug })) }

export default async function PublishedMacroPage({ params }: PageProps<'/macros/[slug]'>) {
  const { slug } = await params
  const macro = findPublishedMacro(slug)
  if (!macro) notFound()

  return <main className="min-h-screen bg-stone-50 px-6 py-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 sm:px-10"><div className="mx-auto max-w-3xl"><Link href="/macros" className="text-sm text-zinc-600 hover:underline dark:text-zinc-300">← 公開マクロ一覧に戻る</Link><article className="mt-8 rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-10"><div className="flex flex-wrap gap-2">{macro.tags.map((tag) => <Link key={tag} href={`/macros?q=${encodeURIComponent(`#${tag}`)}`} className="text-xs font-semibold text-amber-800 underline decoration-amber-400 underline-offset-4 hover:text-amber-600 dark:text-amber-200">#{tag}</Link>)}</div><h1 className="mt-5 text-3xl font-semibold tracking-tight">{macro.title}</h1><p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-300">{macro.description}</p><section className="mt-8"><h2 className="text-sm font-semibold">マクロ本文</h2><pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-5 font-mono text-sm leading-7 text-zinc-100">{macro.body}</pre><p className="mt-3 text-xs leading-5 text-zinc-500">ゲーム内の動作を保証するものではありません。</p></section><div className="mt-8"><Link href={`/?m=${encodeDocument({ version: 1, body: macro.body })}`} className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">エディタで開く</Link></div><section className="mt-10"><PublishedMacroReactions macroSlug={macro.slug} initialHelpful={macro.reactions.helpful} initialProblem={macro.reactions.problem} /></section><footer className="mt-10 border-t border-zinc-200 pt-5 text-xs text-zinc-500 dark:border-zinc-800">投稿者 {macro.authorHandle} · {macro.publishedAt}</footer></article><div className="mt-5"><Link href="/macros/submit" className="text-sm text-zinc-600 underline underline-offset-4 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white">このマクロをもとに公開する</Link></div></div></main>
}
