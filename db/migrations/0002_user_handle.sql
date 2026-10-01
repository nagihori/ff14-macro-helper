-- 公開名：初回の投稿時に入力させ、以後は users に覚えておく。Discord の表示名とは別物で、公開ページに出るのはこちらだけ。
alter table users add column public_handle text check (public_handle is null or char_length(public_handle) between 1 and 20);
