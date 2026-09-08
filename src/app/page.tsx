import { MacroWorkbench } from '@/components/MacroWorkbench'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <header className="w-full max-w-5xl px-8 pt-8">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          ff14-macro-helper
        </h1>
        <p className="text-sm text-zinc-500">
          FFXIV マクロの編集・診断・ログプレビュー・共有をブラウザ内で完結します。
        </p>
      </header>
      <MacroWorkbench />
    </div>
  )
}
