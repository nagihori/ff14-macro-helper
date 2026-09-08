# ff14-macro-helper Agent Rules

## 最優先事項

1. 実際にゲーム内へ貼り付けるマクロを、迷わず安全に書けること。
2. 公式情報を根拠にし、対応できない挙動は推測で「正しい」と断定しないこと。
3. エディタ UI、コマンド辞書、解析・検証・ログ変換を分離し、GUI ガイドへ拡張可能にすること。

## 守るべき設計

- テキスト入力は単一の解析入口で正規化し、トークン、診断、補完、実行ログを同じ解析結果から導く。
- コマンド名、短縮名、引数形式、説明、公式 URL、対応状況はコマンド辞書で管理する。UI に個別コマンドの知識を散らさない。
- 行数・文字数・構文・コマンド固有の制約は `lib/` のルールとして実装し、表示部品に重複させない。
- URL は共有用の可逆データであり、個人情報、トークン、不要なメタデータを含めない。
- 公式仕様と異なる可能性がある簡易実行は、常に「プレビュー」であることを明示する。

## フロントエンド方針

- MVP は PC ブラウザを最優先にする。エディタの読み書き、候補選択、コピー操作をキーボード中心で完結できるようにする。
- 色だけに依存しない。エラーには行番号、内容、修正の手がかりを表示する。
- 補完候補は入力中の文字列と短縮名の両方で絞り、選択中の候補の説明と引数形式を表示する。
- 色、余白、文字サイズはトークンから定義し、ゲーム風の装飾が可読性を損なわないようにする。

## データ処理方針

- 公式ヘルプを取り込む際は、取得元 URL、確認日、ゲームバージョン、手動レビュー状態を残す。
- AI は辞書化・要約の補助に使えるが、原文・構文・制約の正しさの根拠にはしない。
- 未対応コマンドは「未知」ではなく、辞書にはあるが lint／ログ未対応なのかを区別する。
- 永続 DB が必要になった場合は Neon を使う。Upabase を新規採用しない。

## 禁止事項

- 15 行・180 文字／行の違反をコピー時まで黙って見逃すこと。
- プレビューの結果をゲーム内での成功保証として表示すること。
- 公式情報の自動取得結果をレビューなしにそのまま公開・配布すること。
- UI コンポーネント内へ文字数計算、構文判定、コマンド別ログ表現を埋め込むこと。
- URL 共有のために外部サービスや DB を MVP から必須にすること。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
