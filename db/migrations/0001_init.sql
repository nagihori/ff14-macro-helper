-- 公開マクロ機能の初期スキーマ。
-- 方針：Discord の情報は「認証と公開停止に必要な最小限」だけ持つ。アバターは取得しない。
--       公開ページに出す名前（author_handle）は、Discord の表示名とは切り離して macros 側に持つ。

create table users (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                 -- 'discord'（将来 'twitter' など）
  provider_account_id text not null,      -- OAuth 側のユーザー ID。公開しない
  display_name text,                      -- OAuth 側の表示名。内部用で公開しない
  created_at timestamptz not null default now(),
  unique (provider, provider_account_id)
);

create table macros (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 1 and 60),
  description text not null default '',
  body text not null,
  tags text[] not null default '{}',
  author_id uuid references users (id),   -- 初期サンプルなど投稿者なしの行は null
  author_handle text not null,            -- 公開用の名前
  arranged_from uuid references macros (id) on delete set null,
  status text not null default 'published' check (status in ('published', 'suspended')),
  suspended_at timestamptz,
  helpful_count integer not null default 0 check (helpful_count >= 0),
  problem_count integer not null default 0 check (problem_count >= 0),
  published_at timestamptz not null default now()
);

create index macros_published_at_idx on macros (published_at desc) where status = 'published';
create index macros_tags_idx on macros using gin (tags);
