# src インデックス

`src/` 内の主要な tsx / css が何をしているかの一覧。リンクはこのファイル（ルート）からの相対パス。

## 全体の枠

- [`app/globals.css`](src/app/globals.css) — デザイントークン（パレット＋意味名トークン。ライト/ダークは `light-dark()` で1行）、`html` / `body` の基本スタイル。リセットを読み込む
- [`styles/reset.css`](src/styles/reset.css) — 最小限のリセット（Tailwind の preflight から必要分だけ引き継ぎ）
- [`styles/_mixins.scss`](src/styles/_mixins.scss) — 各 `*.module.scss` から `@use` する共通部品（文字サイズ `type()`、ブレークポイント、タグリンク・カード・ピルボタン等、`tone()`）
- [`app/layout.tsx`](src/app/layout.tsx) — ルートレイアウト。`lang="ja"`、metadata、globals.css の読み込み、`ThemeToggle` の配置、保存済みテーマを描画前に反映する小スクリプト
- スタイルは各 tsx と同じ場所の `*.module.scss`（CSS Modules + SCSS、意味名クラス）。色は `globals.css` のトークンを参照する

## ページ

- [`app/page.tsx`](src/app/page.tsx)（＋ `page.module.scss`）— トップ。ヘッダーと公開マクロ一覧への導線を置き、`MacroWorkbench` を表示
- [`app/macros/page.tsx`](src/app/macros/page.tsx) — 公開マクロ一覧。`?q=` を受け取り `PublishedMacroLibrary` へ初期検索語として渡す
- [`app/macros/[slug]/page.tsx`](src/app/macros/%5Bslug%5D/page.tsx) — 公開マクロの詳細。本文・タグ・リアクション・投稿者を表示し、「エディタで開く」で本文を `?m=` に載せてトップへ送る
- [`app/macros/submit/page.tsx`](src/app/macros/submit/page.tsx) — 公開投稿ページ。`PublishFromUrlForm` を置くだけの薄いラッパー

## コンポーネント

- [`components/MacroWorkbench.tsx`](src/components/MacroWorkbench.tsx) — マクロエディタ本体。解析・診断・ハイライト・コマンド補完・プレースホルダ補完・ログプレビュー・コマンド辞書検索・共有 URL の生成と復元。ロジックは `lib/` 側に置き、ここは表示と入力処理
- [`components/ThemeToggle.tsx`](src/components/ThemeToggle.tsx) — 右肩に固定した絵文字ひとつのライト/ダーク切り替え。`<html data-theme>` を切り替え、選択は localStorage（`lib/theme.ts`）に保存。未設定なら OS 設定に従う
- [`components/PublishedMacroLibrary.tsx`](src/components/PublishedMacroLibrary.tsx) — 公開マクロ一覧の UI。タイトル・説明・`#タグ` を同じ検索欄で絞り込む（データはサンプル固定）
- [`components/PublishedMacroReactions.tsx`](src/components/PublishedMacroReactions.tsx) — 「役に立った」「不具合あり」ボタン。Cookie で同一ブラウザの重複を防ぐ（件数はサーバー未連携）
- [`components/PublishFromUrlForm.tsx`](src/components/PublishFromUrlForm.tsx) — 共有 URL・タイトル・タグの公開フォーム。送信はまだ UI 試作で、メッセージを出すだけ

## メモ

- 公開マクロ系（`src/app/macros/*`、`PublishedMacro*`、`PublishFromUrlForm`）は、データがサンプル固定で永続化も投稿処理も未実装
- `MacroWorkbench.tsx` の説明は冒頭と state 定義を読んだ範囲＋機能名からの推測を含む。細部は要確認
