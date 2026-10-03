-- 公開名を一意にする。運営を名乗る・なりすます名前を作りにくくし、削除依頼などで人を特定しやすくする。
-- 照合用のキーは「全角半角・大文字小文字・空白の違いを無視した形」。生成列にして、アプリ側と二重に実装しない。
-- 既存の公開名に重複があると unique index の作成で失敗する（このファイルごとロールバックされ、何も変わらない）。
-- 本番に流す前に docs/publish.md の「公開名を一意にするマイグレーション」の確認用 SQL を実行すること。
alter table users add column public_handle_key text
  generated always as (lower(regexp_replace(normalize(public_handle, NFKC), '\s', '', 'g'))) stored;
create unique index users_public_handle_key_idx on users (public_handle_key);
