# src インデックス

`src/` 内の主要な tsx / css が何をしているかの一覧。リンクはこのファイル（ルート）からの相対パス。

## 全体の枠

- [`app/globals.css`](src/app/globals.css) — デザイントークン（パレット＋意味名トークン。タイトルボックスの色 `--surface-tint` は不透明で、ページ背景が違っても同じ色。差し色は意味名（`--accent-fill` `--text-on-accent` `--accent-text`、タグリンクは `--link-tag*`）で持ち、ライトは独自色のクリムゾン（#eb0949 基準、`--crimson-*`）×白・ダークは黄色×暗色（警告の琥珀とは別物）。ライト/ダークは `light-dark()` で1行）、`html` / `body` の基本スタイル。リセットを読み込む
- [`styles/reset.css`](src/styles/reset.css) — 最小限のリセット（Tailwind の preflight から必要分だけ引き継ぎ）
- [`styles/_mixins.scss`](src/styles/_mixins.scss) — 各 `*.module.scss` から `@use` する共通部品（文字サイズ `type()`、ブレークポイント、スマホ幅 `mobile`、タッチ端末の入力欄 16px `touch-input-size`（iOS のフォーカス時ズーム対策）、タグリンク・カード・ピルボタン等、`tone()`）
- [`app/layout.tsx`](src/app/layout.tsx) — ルートレイアウト。`lang="ja"`、metadata、globals.css の読み込み、`SiteHeader`（中に `ThemeToggle`）・`SiteFooter` の配置（ヘッダー／フッターは全ページ共通。body は縦フレックスで、各ページの外枠が余りの高さを埋める）、保存済みテーマを描画前に反映する小スクリプト
- スタイルは各 tsx と同じ場所の `*.module.scss`（CSS Modules + SCSS、意味名クラス）。色は `globals.css` のトークンを参照する

## ページ

- [`app/page.tsx`](src/app/page.tsx)（＋ `page.module.scss`）— トップ。コンパクトな `PageHero`（マクロエディタ）、`MacroWorkbench` の順に表示
- [`app/macros/page.tsx`](src/app/macros/page.tsx) — 公開マクロ一覧。`?q=` を受け取り `PublishedMacroLibrary` へ初期検索語として渡す。「自作マクロを投稿」（新規投稿の入口）は `PublishedMacroLibrary` の件数の横。ページ最下部に Discord ログイン／ログアウト。ログイン中なら「公開停止中」のマクロへの入口も出す（管理者は全件、投稿者は自分の分）
- [`app/macros/tag/[tag]/page.tsx`](src/app/macros/tag/%5Btag%5D/page.tsx)（＋ `.module.scss`）— タグ別一覧（`/macros/tag/タグ名`）。そのタグの公開マクロを新しい順に、一覧と同じカード（`PublishedMacroCardList`）で出し。「公開マクロ一覧へ」はセカンダリボタン、一緒に付いているタグへ内部リンクを張る。0 件は 404。`MIN_INDEXABLE_TAG_MACROS` 件未満は noindex（`lib/published-macros/tags.ts`）
- [`app/macros/[slug]/page.tsx`](src/app/macros/%5Bslug%5D/page.tsx) — 公開マクロの詳細。本文・タグ・リアクション・投稿者・派生マクロ（このマクロをアレンジ元にした公開中のもの、`findDerivedMacros`）・似たマクロ（共通タグ順、`findRelatedMacros`）を表示し、コードブロック上部に操作帯（`MacroCodeBar`：copy / edit / share）、本文は `MacroCodeView` で色分け、直下に `MacroPreviewAccordion`（動作プレビュー）、その下にアクションボタン群の「マクロテキストをコピー」（主）・「エディタで編集」・共有（副）で本文を（アレンジ元の slug を `&from=` で持たせて） `?m=` に載せてトップへ送る。停止中のマクロは管理者と投稿者本人にだけ表示し（`findMacroForViewer`）、停止の知らせを出す。管理者にはさらに `AdminMacroControls`
- [`app/macros/[slug]/opengraph-image.tsx`](src/app/macros/%5Bslug%5D/opengraph-image.tsx) — 詳細ページの共有カード（1200×630）。公開中のマクロのタイトル・説明・タグ・投稿者名を描く。日本語フォントは描く文字だけを Google Fonts から取得。title / description / `og:*` は同階層の `page.tsx` の `generateMetadata`
- [`app/macros/[slug]/actions.ts`](src/app/macros/%5Bslug%5D/actions.ts) — 公開停止／再公開のサーバーアクション。セッションの `isAdmin` は信用せず、`users` の Discord ID を `ADMIN_DISCORD_IDS` と毎回照合する
- [`app/macros/[slug]/owner-actions.ts`](src/app/macros/%5Bslug%5D/owner-actions.ts) — 投稿者本人の編集（タイトル・説明・タグ）と削除のサーバーアクション。毎回 `author_id` と照合する。削除は本文などを空にして `status = 'deleted'`
- [`app/macros/[slug]/edit/page.tsx`](src/app/macros/%5Bslug%5D/edit/page.tsx) — 編集ページ。本人の公開中のマクロ以外は 404
- [`app/macros/submit/page.tsx`](src/app/macros/submit/page.tsx) — 公開投稿ページ。ログイン状態・保存済みの公開名・タグ候補・既存マクロ（アレンジ元の照合用）を取得して `PublishFromUrlForm` に渡す。未ログインならフォームの代わりに `AuthButton`（ログイン後にこのページへ戻る）
- [`app/macros/submit/actions.ts`](src/app/macros/submit/actions.ts) — 公開フォームのサーバーアクション。ログイン必須。`validatePublish` で共有URL の復号と lint を再検証し、通ったものだけ `store.ts` で保存して詳細ページへ移る
- [`app/api/auth/[...nextauth]/route.ts`](src/app/api/auth/%5B...nextauth%5D/route.ts) — Auth.js のハンドラ。設定は [`src/auth.ts`](src/auth.ts)（Discord・scope は identify のみ・JWT。アバター／表示名／メールはトークンに残さない。管理者は `ADMIN_DISCORD_IDS`）
- [`app/terms/page.tsx`](src/app/terms/page.tsx) — 利用規約。非公式ツールである旨、無保証、投稿ルール、投稿内容のライセンス、公開停止、免責。Discord アプリの規約 URL に使う
- [`app/privacy/page.tsx`](src/app/privacy/page.tsx) — プライバシーポリシー。取得するのは Discord のユーザー ID と表示名のみ（`identify` scope）。Cookie・localStorage の用途、外部サービス（Discord / Vercel / Neon）、削除依頼の窓口。Discord アプリのプライバシーポリシー URL に使う

## コンポーネント

- [`components/icons.tsx`](src/components/icons.tsx) — 線画 SVG アイコン一式（警告・コピー・共有・プレビュー・編集・チェック・バツ・役に立った）。`label` を渡すと読み上げ可能、無ければ装飾扱い
- [`components/PageHero.tsx`](src/components/PageHero.tsx)（＋ `.module.scss`）— ページ冒頭の暗いタイトルボックス（/macros と / で共通。`compact` で少し小さく）
- [`lib/shortcuts.ts`](src/lib/shortcuts.ts) — エディタのショートカット（Ctrl+Alt+C / P / S、Mac は ⌃⌥）の判定と表示用の表記。`event.code` で判定
- [`components/EditorGuide.tsx`](src/components/EditorGuide.tsx)（＋ `.module.scss`）— エディタページ下部の「エディタの使い方」アコーディオン（初期は閉）。基本操作・サジェスト・代名詞補完・Tab/Esc・ショートカット・プレビュー・文字色の凡例。凡例の色は `styles/_mixins.scss` の `$highlight-tones` を `MacroWorkbench` と共有
- [`components/MacroDescription.tsx`](src/components/MacroDescription.tsx) — 説明文の表示。展開済みの `descriptionParts`（他マクロ URL → タイトルリンク／削除済み表記）で描く。設計は `docs/publish.md`
- [`components/LogLegend.tsx`](src/components/LogLegend.tsx)（＋ `.module.scss`）— ログプレビューの下の凡例。いま出ている行の送信先の色、代名詞の表示（`**値**`／`<>` のまま）、再現できない行の警告、`<wait.N>` の「N秒待機」行の注記。色は `styles/_mixins.scss` の `$log-tones` を `LogList` と共有
- [`components/DiscordLogo.tsx`](src/components/DiscordLogo.tsx) — Discord 公式シンボル（白）。変形・色変更はしない
- [`app/not-found.tsx`](src/app/not-found.tsx) —  404 の共通表示（未知の URL・削除済み・公開停止中）。公開マクロから「役に立った」順のおすすめを添える（`listRecommendedMacros`）。リクエストごとに作る（`connection()`）。DB に届かないときはおすすめだけ省く
- [`app/error.tsx`](src/app/error.tsx) — 想定外のエラー（DB に届かないなど）の共通表示。「もう一度読み込む」（このバージョンの Next では `retry`）とエディタへの導線、運営のログと突き合わせる digest（エラー ID）を出す。Client Component で、エラーの中身は本番では伏せられる
- [`app/status-page.module.scss`](src/app/status-page.module.scss) — 404・エラー表示の共通レイアウト
- [`app/robots.ts`](src/app/robots.ts) — robots.txt。公開ページ以外（API・投稿／編集画面・共有URL・検索結果）を巡回させない。sitemap の場所も示す
- [`app/sitemap.ts`](src/app/sitemap.ts) — sitemap.xml。固定ページ＋公開中のマクロ詳細（`listSitemapEntries`）＋ `MIN_INDEXABLE_TAG_MACROS` 件以上のタグ別一覧（`listIndexableTags`）。1 時間ごとに再生成
- [`lib/site-url.ts`](src/lib/site-url.ts) — サイトの絶対 URL の基準（`SITE_URL`）。共有カードの基準と、説明内のマクロ URL の判別で共用
- [`lib/site-config.ts`](src/lib/site-config.ts) — サイト名・既定の title / description（`BRAND_NAME` `DEFAULT_TITLE` `DEFAULT_DESCRIPTION`）。layout・各ページ・OGP 画像が参照
- [`lib/share/lodestone.ts`](src/lib/share/lodestone.ts) — マクロを Lodestone 掲示板の BB コード（タイトルのリンク行、`[hb]` で畳んだ説明文と色付き本文、末尾にサイトへのリンク。形は `docs/for_marketing.md` の sample）へ書き出す純粋な関数。色は `[hb]` の明るい背景用に固定（単体テスト `lodestone.test.ts`）
- [`lib/macro/double-slash.ts`](src/lib/macro/double-slash.ts) — 行頭「/」の直後の「/」（手癖の「//」）を「/」に戻す純粋な関数
- [`components/ActionButton.tsx`](src/components/ActionButton.tsx)（＋ `.module.scss`）— 非エンジニア向けのアイコン付き丸ボタン（ボタン／リンク兼用）。`publish` は公開／投稿系の差し色（`pill-action-publish`。ライブラリの「自作マクロを投稿」・投稿フォームの送信も同じ）。`feedback` でコピー結果（チェック／バツ＋文言）に切り替わる
- [`components/ActionGroup.tsx`](src/components/ActionGroup.tsx)（＋ `.module.scss`）— アクションボタン群の共通枠（エリア中央揃え・折り返し。スマホ幅では縦積み・幅いっぱい）
- [`components/ActionBar.tsx`](src/components/ActionBar.tsx)（＋ `.module.scss`）— コードブロック上部の操作帯（小アイコン＋英小文字キャプション）。`onDark` で常時暗い面向けの配色
- [`components/useCopyFeedback.ts`](src/components/useCopyFeedback.ts) — コピー結果（成功／失敗）を一定時間見せて戻すフック。操作帯・ボタン・共有で共通
- [`lib/ui-text.ts`](src/lib/ui-text.ts) — ボタン文言の単一の定義。対応表は [`docs/ui-text.md`](docs/ui-text.md)
- [`components/MacroWorkbench.tsx`](src/components/MacroWorkbench.tsx) — マクロエディタ本体。解析・診断・ハイライト・コマンド補完・プレースホルダ補完・ログプレビュー・コマンド辞書検索・共有URL の生成と復元。上部に操作帯、下部にアクションボタン群、検索欄の下に種類名の色の凡例（ログの凡例はプレビュー中だけ `LogLegend` が出す）、初期本文は「/」。本文は sessionStorage にも写し、タブ移動で戻ったときに復元する（優先順は `?m=` → 保存済み → 「/」。復元が済む前に初期値で上書きしない）。「公開する」（`handlePublish`）もここ：現在の本文から共有URL を作り `/macros/submit?url=` へ遷移する。Tab は常にエディタが奪い、候補が無い状態で Esc を押した直後の Tab だけフォーカス移動に譲る。行番号は折り返した行の高さに追従（ハイライト層の各行の高さを測る）。幅は全ページ共通の 72rem で、エディタ側は従来のコンパクトさのまま、広げた分は右の検索・候補（列比 1:1.25）に回す。ロジックは `lib/` 側に置き、ここは表示と入力処理
- [`components/LegalDocument.tsx`](src/components/LegalDocument.tsx)（＋ `.module.scss`）— 利用規約・プライバシーポリシー共通の文書枠。見出し・段落・箇条書きの余白と、もう一方の文書へのリンク
- [`components/SiteHeader.tsx`](src/components/SiteHeader.tsx)（＋ `.module.scss`）— 全ページ共通のヘッダー。ブランド名（左にアイコン `public/favicon.png` を `next/image` で小さく表示。差し色の文字。環境変数で変わるため layout から props）と「エディタ」「ライブラリ」のタブ。タブはルート遷移で、現在地は `aria-current`（選択中は差し色の下線。ライブラリは `/macros` 配下すべて、規約などではどちらも選ばない）。PC 幅は「ブランド名｜タブ×2｜正方形の `ThemeToggle`」で帯の幅いっぱいにタブを等分、スマホ幅はブランド名の下にタブを等分し、`ThemeToggle` はブランド名の行の右端
- [`components/MacroCardSection.tsx`](src/components/MacroCardSection.tsx)（＋ `.module.scss`）— マクロのカード一覧（詳細ページの「似たマクロ」「派生」と 404 のおすすめで共用）
- [`components/GoogleAnalytics.tsx`](src/components/GoogleAnalytics.tsx) — Google アナリティクス 4。`GA_MEASUREMENT_ID` があるとき本番だけ layout が描画。ページビューはクエリを落とした URL で自前送信。設計は `docs/publish.md`
- [`components/SiteFooter.tsx`](src/components/SiteFooter.tsx)（＋ `.module.scss`）— 全ページ共通のフッター（利用規約・プライバシーポリシー）。ログインはセッションを読むので、共通側には置かない（`/` を静的なままにするため）
- [`components/ThemeToggle.tsx`](src/components/ThemeToggle.tsx) — ヘッダー内（`SiteHeader`）に置いた線画アイコン（太陽・月）ひとつのライト/ダーク切り替え。`<html data-theme>` を切り替え、選択は localStorage（`lib/theme.ts`）に保存。未設定なら OS 設定に従う
- [`components/PublishedMacroCardList.tsx`](src/components/PublishedMacroCardList.tsx)（＋ `.module.scss`）— 公開マクロのカード一覧（タイトル・説明・投稿者・投票）。`/macros` とタグ別一覧で共通。カード内のタグはタグ別一覧へのリンク
- [`components/PublishedMacroLibrary.tsx`](src/components/PublishedMacroLibrary.tsx) — 公開マクロ一覧の UI。タイトル・説明・`#タグ` を同じ検索欄で絞り込む（空白区切りの AND 検索。上のタグ一覧のクリックは検索語へ追加、カード内タグはタグ別一覧ページ `/macros/tag/…` へのリンク。データは親ページが DB から取得して `allMacros` で渡す）
- [`components/PublishedMacroReactions.tsx`](src/components/PublishedMacroReactions.tsx) — 「役に立った」「不具合あり」ボタン。件数はサーバー集計で、押した直後は先に表示を動かしてサーバーの返答で確定する。同一ブラウザの重複は Cookie で防ぎ、アイコン付き（役に立った＝親指／不具合あり＝警告）。投票後も両件数を緑／赤で表示し、自分の側は太字＋取り消し ×
- [`app/macros/reactions.ts`](src/app/macros/reactions.ts) — 投票のサーバーアクション `setReaction`。Cookie の現在値との差分だけを `helpful_count` / `problem_count` に反映する（公開中のマクロのみ・件数は負にならない）。Cookie は書き換え可能なので厳密な不正対策ではない
- [`components/ShareMacroButton.tsx`](src/components/ShareMacroButton.tsx)（＋ `.module.scss`）— 詳細ページの共有ボタン。本体はアイコン＋「URLをコピー」（共有シートが使える端末では「URLを共有」）で、右端の ▼ で「ほかの共有方法」（いまは「Lodestone用にコピー」）のパネルが開く。BB コードはサーバーで作って props で受ける。判定とコピー処理は `useShareUrl`。停止中のマクロには出さない
- [`components/useShareUrl.ts`](src/components/useShareUrl.ts) — 詳細ページの共有処理。タッチ端末で共有に対応していれば OS の共有シート、それ以外はページ URL をコピー（クエリは含めない）
- [`components/MacroCodeBar.tsx`](src/components/MacroCodeBar.tsx) — 詳細ページのコードブロック上部の操作帯（copy / edit / share。暗い面向け配色）
- [`components/MacroCodeView.tsx`](src/components/MacroCodeView.tsx)（＋ `.module.scss`）— 詳細ページのコード本文。エディタと同じ `buildHighlight` で色分けする読み取り専用の表示（サーバーコンポーネント。波線・背景の警告は付けない。常に暗い面なので色は `$highlight-tones` のダーク側）
- [`components/MacroPreviewAccordion.tsx`](src/components/MacroPreviewAccordion.tsx)（＋ `.module.scss`）— 詳細ページの「動作プレビュー」アコーディオン（初期は閉、サーバーコンポーネント）。`toLogPreview` の結果を全行一括で表示し、時刻は実時刻に展開せず `[HH:mm]` の文字列のまま。`LogList` と `LogLegend` を使う
- [`components/LogList.tsx`](src/components/LogList.tsx)（＋ `.module.scss`）— ログプレビューの行の一覧。エディタの動作プレビューと詳細ページで共有。色は `$log-tones`。`kind: 'wait'`（行内 `<wait.N>` の注釈）は時刻なしで淡色
- [`components/CopyMacroButton.tsx`](src/components/CopyMacroButton.tsx) — 詳細ページの「マクロテキストをコピー」主ボタン（`ActionButton` ＋ `useCopyFeedback`）
- [`components/useMacroCheck.tsx`](src/components/useMacroCheck.tsx) — コピー・共有URL・公開の直前に本文を解析し、エラー／警告があれば `MacroCheckDialog` を挟む `guard()` を返すフック（打ちかけの最終行も確定扱いで解析）
- [`components/MacroCheckDialog.tsx`](src/components/MacroCheckDialog.tsx)（＋ `.module.scss`）— 問題の一覧（重大度・行番号・内容）を見せ、「エディタで修正する」か「このまま進む」を選ばせる確認ダイアログ
- [`components/PublishFromUrlForm.tsx`](src/components/PublishFromUrlForm.tsx)（＋ `.module.scss`）— 共有URL・タイトル・説明（複数行・5行まで・空行不可のテキストエリア）・タグ（初回のみ公開名）の投稿フォーム（連続マクロの案内は折りたたみ）（保存済みの公開名は「変更する」リンクで入力欄に切り替わる）。`?url=` で共有URL を初期入力。タグ欄は既存タグを弱いリンクで下に並べ、入力中の語で絞り込む。URL に `from=`（アレンジ元）があれば元マクロを表示。送信は `submitMacro`（useActionState）で、サーバー側のエラーを文で一覧表示する。未ログインなら `loginSlot` を出す
- [`components/AuthButton.tsx`](src/components/AuthButton.tsx)（＋ `.module.scss`）— Discord ログイン（公式ガイドラインの Blurple ボタン・白ロゴ＝`DiscordLogo`）／ログアウト（サーバーコンポーネント。`redirectTo` でログイン後の戻り先を指定）
- [`components/OwnerMacroControls.tsx`](src/components/OwnerMacroControls.tsx) — 詳細ページの投稿者向け操作欄（編集リンク・二段階確認つきの削除）。見た目は `AdminMacroControls.module.scss` を共用
- [`components/MacroMetaFields.tsx`](src/components/MacroMetaFields.tsx) — 投稿・編集フォーム共通の、タイトル・説明・タグ（既存タグの候補つき）の入力欄と案内、連続マクロの折りたたみ案内（`ContinuedMacroGuide`）。値は自前の state で持ち、エラーで入力が消えない
- [`components/EditMacroForm.tsx`](src/components/EditMacroForm.tsx) — 編集フォーム。本文は直せない旨を案内。入力欄と案内は投稿フォームと共通（`MacroMetaFields`）。見た目は `PublishFromUrlForm.module.scss` を共用
- [`components/AdminMacroControls.tsx`](src/components/AdminMacroControls.tsx)（＋ `.module.scss`）— 詳細ページの管理者向け操作欄（公開停止／再公開。停止中は `AdminDeleteControl` の二段階確認つき削除も出す）。破線の枠で一般の操作と区別する

## メモ

- 公開マクロ系（`src/app/macros/*`、`PublishedMacro*`、`PublishFromUrlForm`）の読み取りは Neon（`src/lib/published-macros/repository.ts`、接続は `src/lib/db.ts`）。公開停止（`status = 'suspended'`）の行は一覧・詳細・似たマクロ・アレンジ元リンクから外れる。削除済み（`'deleted'`）の行は同じく外れ、派生側にはタイトルだけが「削除済み」として残る。書き込みは `store.ts`、入力検証は UI と切り離した `publish.ts`（単体テスト `publish.test.ts`、`npm test`）。公開名は初回の投稿時に `users.public_handle` へ保存し、フォームの「変更する」で変更できる（過去の自分の投稿の表示名も追従）。管理者の判定は `src/lib/admin.ts`。リアクションは `app/macros/reactions.ts` で集計
- DB のスキーマは `db/migrations/*.sql`（`npm run db:migrate`）、動作確認用のサンプルは `scripts/seed-samples.mjs`
- `MacroWorkbench.tsx` の説明は冒頭と state 定義を読んだ範囲＋機能名からの推測を含む。細部は要確認
