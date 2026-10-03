-- 短縮共有 URL（/s/{id}）。エディタの共有 URL（?m=…）が長いので、本文を保存して短い ID で開けるようにする。
-- 匿名（ログイン不要）で作れる。作った人は Cookie の値のハッシュ（creator）で区別し、1 人あたりの保存数に上限を持つ
-- （超えたら最後に開かれてから最も古いものから消す）。最後に開かれてから 180 日で期限切れ（作成・参照のときに削除）。
-- body_hash は「同じ人が同じマクロを何度共有しても 1 件にまとめる」ための重複判定（origin_slug も含めたハッシュ）。
create table shared_macros (
  id text primary key,
  creator text not null,
  body text not null,
  origin_slug text,
  body_hash text not null,
  created_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now()
);
create unique index shared_macros_creator_hash_idx on shared_macros (creator, body_hash);
create index shared_macros_creator_opened_idx on shared_macros (creator, last_opened_at);
create index shared_macros_opened_idx on shared_macros (last_opened_at);
create index shared_macros_created_idx on shared_macros (created_at);
