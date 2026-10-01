# src インデックス

`src/` 内の主要な tsx / css が何をしているかの一覧。リンクはこのファイル（ルート）からの相対パス。

## 全体の枠

- [`app/globals.css`](src/app/globals.css) — デザイントークン（パレット＋意味名トークン。ライト/ダークは `light-dark()` で1行）、`html` / `body` の基本スタイル。リセットを読み込む
- [`styles/reset.css`](src/styles/reset.css) — 最小限のリセット（Tailwind の preflight から必要分だけ引き継ぎ）
- [`styles/_mixins.scss`](src/styles/_mixins.scss) — 各 `*.module.scss` から `@use` する共通部品（文字サイズ `type()`、ブレークポイント、タグリンク・カード・ピルボタン等、`tone()`）
- [`app/layout.tsx`](src/app/layout.tsx) — ルートレイアウト。`lang="ja"`、metadata、globals.css の読み込み、`ThemeToggle` の配置、保存済みテーマを描画前に反映する小スクリプト
- スタイルは各 tsx と同じ場所の `*.module.scss`（CSS Modules + SCSS、意味名クラス）。色は `globals.css` のトークンを参照する

## ページ

- [`app/page.tsx`](src/app/page.tsx)（＋ `page.module.scss`）— トップ。ヘッダー（右肩に「公開マクロを探す」副・「公開する」主）を置き、`MacroWorkbench` を表示
- [`app/macros/page.tsx`](src/app/macros/page.tsx) — 公開マクロ一覧。`?q=` を受け取り `PublishedMacroLibrary` へ初期検索語として渡す。右肩に「公開する」（主）と「エディタに戻る」（副）。ログイン中なら「公開停止中」のマクロへの入口も出す（管理者は全件、投稿者は自分の分）
- [`app/macros/[slug]/page.tsx`](src/app/macros/%5Bslug%5D/page.tsx) — 公開マクロの詳細。本文・タグ・リアクション・投稿者・派生マクロ（このマクロをアレンジ元にした公開中のもの、`findDerivedMacros`）・似たマクロ（共通タグ順、`findRelatedMacros`）を表示し、「マクロテキストをコピー」（主）と「エディタで編集」（副）で本文を（アレンジ元の slug を `&from=` で持たせて） `?m=` に載せてトップへ送る。停止中のマクロは管理者と投稿者本人にだけ表示し（`findMacroForViewer`）、停止の知らせを出す。管理者にはさらに `AdminMacroControls`
- [`app/macros/[slug]/opengraph-image.tsx`](src/app/macros/%5Bslug%5D/opengraph-image.tsx) — 詳細ページの共有カード（1200×630）。公開中のマクロのタイトル・説明・タグ・投稿者名を描く。日本語フォントは描く文字だけを Google Fonts から取得。title / description / `og:*` は同階層の `page.tsx` の `generateMetadata`
- [`app/macros/[slug]/actions.ts`](src/app/macros/%5Bslug%5D/actions.ts) — 公開停止／再公開のサーバーアクション。セッションの `isAdmin` は信用せず、`users` の Discord ID を `ADMIN_DISCORD_IDS` と毎回照合する
- [`app/macros/[slug]/owner-actions.ts`](src/app/macros/%5Bslug%5D/owner-actions.ts) — 投稿者本人の編集（タイトル・説明・タグ）と削除のサーバーアクション。毎回 `author_id` と照合する。削除は本文などを空にして `status = 'deleted'`
- [`app/macros/[slug]/edit/page.tsx`](src/app/macros/%5Bslug%5D/edit/page.tsx) — 編集ページ。本人の公開中のマクロ以外は 404
- [`app/macros/submit/page.tsx`](src/app/macros/submit/page.tsx) — 公開投稿ページ。ログイン状態・保存済みの公開名・タグ候補・既存マクロ（アレンジ元の照合用）を取得して `PublishFromUrlForm` に渡す。未ログインならフォームの代わりに `AuthButton`（ログイン後にこのページへ戻る）
- [`app/macros/submit/actions.ts`](src/app/macros/submit/actions.ts) — 公開フォームのサーバーアクション。ログイン必須。`validatePublish` で共有 URL の復号と lint を再検証し、通ったものだけ `store.ts` で保存して詳細ページへ移る
- [`app/api/auth/[...nextauth]/route.ts`](src/app/api/auth/%5B...nextauth%5D/route.ts) — Auth.js のハンドラ。設定は [`src/auth.ts`](src/auth.ts)（Discord・scope は identify のみ・JWT。アバター／表示名／メールはトークンに残さない。管理者は `ADMIN_DISCORD_IDS`）
- [`app/terms/page.tsx`](src/app/terms/page.tsx) — 利用規約。非公式ツールである旨、無保証、投稿ルール、投稿内容のライセンス、公開停止、免責。Discord アプリの規約 URL に使う
- [`app/privacy/page.tsx`](src/app/privacy/page.tsx) — プライバシーポリシー。取得するのは Discord のユーザー ID と表示名のみ（`identify` scope）。Cookie・localStorage の用途、外部サービス（Discord / Vercel / Neon）、削除依頼の窓口。Discord アプリのプライバシーポリシー URL に使う

## コンポーネント

- [`components/MacroWorkbench.tsx`](src/components/MacroWorkbench.tsx) — マクロエディタ本体。解析・診断・ハイライト・コマンド補完・プレースホルダ補完・ログプレビュー・コマンド辞書検索・共有 URL の生成と復元。ロジックは `lib/` 側に置き、ここは表示と入力処理
- [`components/LegalDocument.tsx`](src/components/LegalDocument.tsx)（＋ `.module.scss`）— 利用規約・プライバシーポリシー共通の文書枠。見出し・段落・箇条書きの余白と、もう一方の文書へのリンク
- [`components/ThemeToggle.tsx`](src/components/ThemeToggle.tsx) — 右肩に固定した線画アイコン（太陽・月）ひとつのライト/ダーク切り替え。`<html data-theme>` を切り替え、選択は localStorage（`lib/theme.ts`）に保存。未設定なら OS 設定に従う
- [`components/PublishedMacroLibrary.tsx`](src/components/PublishedMacroLibrary.tsx) — 公開マクロ一覧の UI。タイトル・説明・`#タグ` を同じ検索欄で絞り込む（空白区切りの AND 検索。タグ例のクリックは検索語へ追加、カード内タグは置き換え。データは親ページが DB から取得して `allMacros` で渡す）
- [`components/PublishedMacroReactions.tsx`](src/components/PublishedMacroReactions.tsx) — 「役に立った」「不具合あり」ボタン。件数はサーバー集計で、押した直後は先に表示を動かしてサーバーの返答で確定する。同一ブラウザの重複は Cookie で防ぎ、投票後も両件数を緑／赤で表示し、自分の側は太字＋取り消し ×
- [`app/macros/reactions.ts`](src/app/macros/reactions.ts) — 投票のサーバーアクション `setReaction`。Cookie の現在値との差分だけを `helpful_count` / `problem_count` に反映する（公開中のマクロのみ・件数は負にならない）。Cookie は書き換え可能なので厳密な不正対策ではない
- [`components/CopyMacroButton.tsx`](src/components/CopyMacroButton.tsx) — 詳細ページの「マクロテキストをコピー」主ボタン。コピー結果をボタン文言で知らせる
- [`components/useMacroCheck.tsx`](src/components/useMacroCheck.tsx) — コピー・共有 URL・公開の直前に本文を解析し、エラー／警告があれば `MacroCheckDialog` を挟む `guard()` を返すフック（打ちかけの最終行も確定扱いで解析）
- [`components/MacroCheckDialog.tsx`](src/components/MacroCheckDialog.tsx)（＋ `.module.scss`）— 問題の一覧（重大度・行番号・内容）を見せ、「エディタで修正する」か「このまま進む」を選ばせる確認ダイアログ
- [`components/PublishButton.tsx`](src/components/PublishButton.tsx) — エディタ右肩の「公開する」。現在の本文から共有 URL を作り、`/macros/submit?url=` へ渡して遷移（本文は `lib/share/editor-draft.ts` の写しを読む。問題が見つかった本文もここ経由でエディタへ伝え、戻った時に波線を残す）
- [`components/PublishFromUrlForm.tsx`](src/components/PublishFromUrlForm.tsx)（＋ `.module.scss`）— 共有 URL・タイトル・説明・タグ（初回のみ公開名）の公開フォーム（保存済みの公開名は「変更する」リンクで入力欄に切り替わる）。`?url=` で共有 URL を初期入力。タグ欄は既存タグを弱いリンクで下に並べ、入力中の語で絞り込む。URL に `from=`（アレンジ元）があれば元マクロを表示。送信は `submitMacro`（useActionState）で、サーバー側のエラーを文で一覧表示する。未ログインなら `loginSlot` を出す
- [`components/AuthButton.tsx`](src/components/AuthButton.tsx)（＋ `.module.scss`）— Discord ログイン／ログアウト（サーバーコンポーネント。`redirectTo` でログイン後の戻り先を指定）
- [`components/OwnerMacroControls.tsx`](src/components/OwnerMacroControls.tsx) — 詳細ページの投稿者向け操作欄（編集リンク・二段階確認つきの削除）。見た目は `AdminMacroControls.module.scss` を共用
- [`components/EditMacroForm.tsx`](src/components/EditMacroForm.tsx) — 編集フォーム。本文は直せない旨を案内。見た目は `PublishFromUrlForm.module.scss` を共用
- [`components/AdminMacroControls.tsx`](src/components/AdminMacroControls.tsx)（＋ `.module.scss`）— 詳細ページの管理者向け操作欄（公開停止／再公開）。破線の枠で一般の操作と区別する

## メモ

- 公開マクロ系（`src/app/macros/*`、`PublishedMacro*`、`PublishFromUrlForm`）の読み取りは Neon（`src/lib/published-macros/repository.ts`、接続は `src/lib/db.ts`）。公開停止（`status = 'suspended'`）の行は一覧・詳細・似たマクロ・アレンジ元リンクから外れる。削除済み（`'deleted'`）の行は同じく外れ、派生側にはタイトルだけが「削除済み」として残る。書き込みは `store.ts`、入力検証は UI と切り離した `publish.ts`（単体テスト `publish.test.ts`、`npm test`）。公開名は初回の投稿時に `users.public_handle` へ保存し、フォームの「変更する」で変更できる（過去の自分の投稿の表示名も追従）。管理者の判定は `src/lib/admin.ts`。リアクションは `app/macros/reactions.ts` で集計
- DB のスキーマは `db/migrations/*.sql`（`npm run db:migrate`）、動作確認用のサンプルは `scripts/seed-samples.mjs`
- `MacroWorkbench.tsx` の説明は冒頭と state 定義を読んだ範囲＋機能名からの推測を含む。細部は要確認
