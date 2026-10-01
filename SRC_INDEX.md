# src インデックス

`src/` 内の主要な tsx / css が何をしているかの一覧。リンクはこのファイル（ルート）からの相対パス。

## 全体の枠

- [`src/app/globals.css`](src/app/globals.css) — Tailwind の読み込み、背景色・文字色の CSS 変数、ダークモード切り替え
- [`src/app/layout.tsx`](src/app/layout.tsx) — ルートレイアウト。`lang="ja"`、metadata、globals.css の読み込み

## ページ

- [`src/app/page.tsx`](src/app/page.tsx) — トップ。ヘッダーを置き、`MacroWorkbench` を表示

## コンポーネント

- [`src/components/MacroWorkbench.tsx`](src/components/MacroWorkbench.tsx) — マクロエディタ本体。解析・診断・ハイライト・コマンド補完・プレースホルダ補完・ログプレビュー・コマンド辞書検索・共有 URL の生成と復元。ロジックは `lib/` 側に置き、ここは表示と入力処理

## メモ

- `MacroWorkbench.tsx` の説明は冒頭と state 定義を読んだ範囲＋機能名からの推測を含む。細部は要確認
