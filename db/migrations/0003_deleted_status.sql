-- 投稿者による削除。行は残し、本文・説明・タグを空にして status = 'deleted' にする。
-- タイトルとスラッグは残るので、派生マクロ側で「アレンジ元：{タイトル}（削除済み）」とリンクなしで示せる。
alter table macros drop constraint macros_status_check;
alter table macros add constraint macros_status_check check (status in ('published', 'suspended', 'deleted'));
alter table macros add column deleted_at timestamptz;
