# 公開マクロライブラリ

エディタで作ったマクロを、共有 URL とは別系統で公開・検索・閲覧できる機能の設計と運用メモ。エディタ本体と URL 共有は、この機能がなくても DB・ログインなしで動く（AGENTS.md の禁止事項）。

## 範囲

- 一覧（キーワード・`#タグ` の AND 検索）、詳細（コピー・エディタで編集・似たマクロ・アレンジ元リンク・派生マクロへのリンク）。
- 投稿は Discord ログイン必須。共有 URL・タイトル・説明・タグ・公開名（初回のみ）を受け取る。
- リアクション（「役に立った」「不具合あり」）。同一ブラウザの重複は Cookie で防ぐ。
- 管理者による公開停止／再公開。停止中は管理者と投稿者本人にだけ見える。
- 利用規約（`/terms`）とプライバシーポリシー（`/privacy`）。Discord アプリの登録に使う。

小規模（不特定多数が触らない）運用を前提にしている。濫用対策などは「ぜいたく機能」へ後回しにした（末尾）。

## 構成

| 場所 | 役割 |
|---|---|
| `db/migrations/*.sql` | スキーマ。`npm run db:migrate` で番号順に適用（適用済みは `_migrations` で記録） |
| `scripts/seed-samples.mjs` | 動作確認用のサンプル 3 件（slug が既にあれば何もしない） |
| `src/lib/db.ts` | Neon（`@neondatabase/serverless`）への接続 |
| `src/lib/published-macros/repository.ts` | 読み取り（一覧・詳細・似たマクロ・タグ・停止中の閲覧） |
| `src/lib/published-macros/publish.ts` | 投稿の入力検証。UI・DB に依存しない純粋な関数（単体テストあり） |
| `src/lib/published-macros/store.ts` | 書き込み（公開名の登録／変更、マクロの保存） |
| `src/auth.ts` / `src/lib/admin.ts` | Discord ログイン（Auth.js）と管理者判定 |
| `src/app/macros/**/actions.ts`, `reactions.ts` | サーバーアクション（投稿・公開停止・投票） |
| `scripts/copy-db.mjs` | 別 DB（本番）の users / macros を開発 DB へコピー（テスト用。コピー先は退避してから上書き） |

ファイル単位の役割は [`SRC_INDEX.md`](../SRC_INDEX.md) を参照。

## データモデル

- `users`：OAuth 側の ID と表示名（内部用・非公開）、公開名 `public_handle`（初回の投稿で登録）。
- `macros`：slug・タイトル・説明・本文・タグ（`text[]`）・投稿者（`author_id`）・公開名の複写（`author_handle`）・アレンジ元（`arranged_from`）・`status`（`published` / `suspended`）・リアクション件数。
- 公開名を変えると、本人の過去の投稿の `author_handle` も追従させる。

## 認証・認可

- Auth.js（`next-auth@beta`）の Discord プロバイダ。scope は `identify` のみ。セッションは JWT（DB アダプタなし）。
- アバター・メール・表示名は、保存もトークンへの格納もしない（プライバシーポリシーの約束）。取得した ID と表示名だけを `users` に持つ。
- 管理者は環境変数 `ADMIN_DISCORD_IDS`（カンマ区切りの Discord ユーザー ID）。画面の出し分けにはセッションの `isAdmin` を使うが、**操作の許可はサーバーアクションが毎回 `users` の ID と照合して再判定する**（古いセッションで権限が残らないように）。

## 投稿の流れ

1. ログイン必須。未ログインならログイン案内を出し、ログイン後は共有 URL を入れた状態で戻す。
2. サーバーで共有 URL を復号して `analyze` を通す。エラーがあれば保存しない（クライアントの検証は信用しない）。警告は通す。
3. タイトル 60 文字・説明 200 文字・タグ 5 個（各 20 文字・空白不可）・公開名 20 文字を検証。
4. 公開名の登録（または変更）とマクロの保存を同一トランザクションで行う。slug は英数字 8 文字を自動発番。アレンジ元は公開中の slug にだけ紐づける。

## 開発手順

```bash
cp .env.example .env.local     # 値を入れる（.env.local は git 管理外）
npm run db:migrate             # スキーマ適用
node --env-file=.env.local scripts/seed-samples.mjs   # サンプル（任意）
npm run dev
npm test                       # 検証ロジックの単体テスト
```

環境変数は `.env.example` を参照する。`.env.example` にはプレースホルダだけを書き、実値は必ず `.env.local` に置く。

## 本番公開チェックリスト

- [ ] **Vercel プロジェクト**：リポジトリに `.vercel/project.json` がない（未リンク）。プロジェクトを作成して GitHub と接続する。
- [ ] **環境変数**（Vercel の Environment Variables）：`DATABASE_URL` / `AUTH_SECRET` / `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` / `ADMIN_DISCORD_IDS`。ローカルと同じ値を流用せず、`AUTH_SECRET` は本番用に生成し直す。
- [ ] **DB を分ける**：ローカルと本番で同じ Neon DB を共有しない（Neon のブランチ機能で開発用を分けると楽）。本番 DB に `npm run db:migrate` を適用する。
- [ ] **サンプルの扱い**：`seed-samples.mjs` のサンプル 3 件を本番に入れるか決める（入れない、または公開後に管理者から停止する）。
- [ ] **Discord アプリ**：OAuth2 の Redirects に `https://<本番ドメイン>/api/auth/callback/discord` を追加。General Information の利用規約 URL に `/terms`、プライバシーポリシー URL に `/privacy` を設定。
- [ ] **ホストの信頼**：Vercel では通常 `AUTH_URL` は不要。ログインに失敗する場合は `AUTH_TRUST_HOST=true` を確認する。
- [ ] **規約・ポリシーの確認**：一般的な雛形なので、公開前に内容を通読する。連絡先は現在 GitHub Issues（メールや SNS にするなら `terms` / `privacy` の `ISSUES_URL` を差し替える）。
- [ ] **管理者の動作確認**：本番で自分の Discord ID が管理者になり、公開停止／再公開ができる。
- [ ] **通しの確認**：ログイン → 投稿 → 一覧・詳細に出る → 投票 → 停止 → 本人に停止の知らせが出る。

## ぜいたく機能（後回し）

小規模運用のうちは不要と判断したもの。規模や状況が変わったら検討する。

**濫用対策・運用**
- NG ワード確認（タイトル・説明・タグ・本文）
- レート制限、連投・重複投稿の歯止め
- 通報の受付窓口（現状は GitHub Issues）
- 停止の理由・実行者・日時の記録（現状は `suspended_at` のみ）と、本人への理由の通知
- リアクションの不正対策（Cookie は利用者が書き換えられる。IP やアカウントとの併用など）
- X OAuth の追加（`.env.example` に枠だけある）

**投稿者まわり**
- 自分の投稿の編集・取り下げ（現状は連絡先への依頼）
- 自分の投稿一覧（マイページ）
- 同じ投稿者のマクロ一覧。公開名は変更できるので、リンクは名前ではなく内部の投稿者 ID を使う必要がある。その ID を URL に載せてよいかも要検討

**一覧・検索**
- 件数が増えた場合のサーバー側検索とページネーション（現状は全件を取得してクライアントで絞り込む）
- 一覧のキャッシュ（現状はリクエストごとに DB を読む）
- タグ辞書の独立とタグの正規化（現状は投稿されたタグ配列から候補を作る）

**開発・運用**
- DB を使う統合テスト、CI（現状は検証ロジックの単体テストのみ）
- マイグレーションの本番適用手順の自動化
- 規約・ポリシーの専門家による確認

## 既知の限界

- リアクションの重複防止は Cookie のみ。偽装されても件数が負にならないことだけを保証している。
- 管理者の権限変更は、環境変数の更新と再デプロイで反映される（アクションごとに再判定するため、ログイン済みセッションの有効期限は待たない）。
- 公開名は自己申告で、なりすましの検証はしていない。
