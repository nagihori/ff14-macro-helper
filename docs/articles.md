# 記事（簡易 CMS）

サイトに、マクロの作り方や小ネタの記事を載せるための小さな仕組み。主に検索からの入口が目的で、目立たせない（フッターの小さなリンクだけ）。書き方は [`content/README.md`](../content/README.md)。

## 構成

| 場所 | 役割 |
|---|---|
| `content/articles/{slug}.md` | 公開する記事。ファイル名（小文字・数字・ハイフン）が URL（`/articles/{slug}`） |
| `content/drafts/` | 下書き・メモ。公開されない。`content/drafts/.gitignore` で Git にも入れない（リポジトリを公開しても、書きかけが出ないように） |
| `src/lib/articles/frontmatter.ts` | フロントマター（`title` `date` `description` `tags`）の読み取り。YAML の全部ではなく、必要な小さな部分だけ（依存を増やさない） |
| `src/lib/articles/split.ts` | 本文を、Markdown の部分と、マクロの埋め込み（`::macro[slug]` だけの行）に分ける。コードブロックの中は埋め込まない |
| `src/lib/articles/markdown.ts` | Markdown → HTML（`marked`）。安全側に倒す設計は下記 |
| `src/lib/articles/load.ts` | `content/articles` を fs で読む。本番はプロセス内で 1 度だけ、開発は毎回。壊れた記事は、ログに理由を出して飛ばす（サイト全体は落とさない） |
| `src/components/ArticleBody.tsx` | 本文の描画。埋め込んだマクロは iframe ではなく、このサイトの中でそのまま描く（`MacroCodeView`） |
| `src/app/articles/` | 一覧（`/articles`）・記事（`/articles/[slug]`）・フィード（`/articles/feed.xml`） |

## 決めたこと

- **依存は `marked` 1 つだけ**（推移的な依存なし。`npm audit` は 0 件）。フロントマターの読み取りは自前（小さく、テストあり）。
- **安全側に倒す**：本文に直接書いた HTML は、タグとして通さず文字として出す。リンク・画像の URL は `http(s)`・`mailto`・サイト内のパス・`#` だけ（`javascript:` や `//` で始まるものは、リンクにしない）。外部リンクは別タブ・`noopener noreferrer`。書くのは自分（リポジトリの中）だが、あとで誰かが記事を足す可能性を考えて。
- **改行はそのまま改行**（`marked` の `breaks: true`）。日本語は 1 文ごとに改行して書くことが多く、空白にすると文のあいだが不自然に空くため。
- **HTML コメントは除く**（`src/lib/articles/comments.ts`。本文に直接書いた HTML は文字として出す方針なので、そのままだとコメントが見えてしまう）。コードブロック・インラインコードの中は触らない。閉じていないコメントは、間違いに気づけるよう残す。
- **マクロの埋め込み**：`::macro[slug]` の行。公開中のマクロだけ。見つからなければ、小さな案内（記事は壊れない）。
- **記事から本体への導線**（本体から記事への導線は、フッターの小さなリンクだけで足りる）：(1) 埋め込んだマクロに `copy` / `edit` の操作帯（`ArticleMacroBar`。詳細ページのコードブロックと同じ見た目）。読んだ人が、マクロをすぐゲームに持っていけるように。(2) 記事の最初の埋め込みの上に、「コピーして、ゲームで試せます」の 1 行（`ArticleBody`。全記事に同じ文を書かなくてよいよう自動）。(3) 記事の末尾に、小さな案内（`ArticleCta`。「マクロエディタを開く」「公開マクロを探す」）。広告のようなバナーにせず、本文の途中には挟まない。
- **記事が 1 本もないあいだ**：`/articles` は `noindex`、sitemap にも載せず、フッターのリンクも出さない。リンクの有無は、`next.config.ts` がビルド時に `content/articles` を調べて環境変数（`NEXT_PUBLIC_HAS_ARTICLES`）で渡す。
- **実行時に fs で読む**ので、記事・フィード・サイトマップの関数に、ファイルが入るよう `outputFileTracingIncludes` を指定してある（`next build` 後の `.nft.json` で確認済み）。
- 記事の追加・変更は、デプロイで反映される（DB を使わない）。

## ぜいたく機能（後回し）

- 記事ごとの共有カード（いまはサイト共通のカード）
- 構造化データ（JSON-LD。`for_marketing.md` の「後回し」の項と一緒に）
- 記事のタグから、タグ別の一覧
- 見出しの目次・アンカー
- `draft: true` の指定（いまは `content/drafts/` に置くだけ）
