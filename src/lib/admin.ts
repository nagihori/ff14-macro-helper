// 管理者（公開停止ができる人）の判定。ADMIN_DISCORD_IDS はカンマ区切りの Discord ユーザー ID。
// 画面の表示出し分けにはセッションの isAdmin を使ってよいが、操作の許可は必ずサーバー側でこの関数を使って再判定する。
export function isAdminAccountId(providerAccountId: string): boolean {
  return (process.env.ADMIN_DISCORD_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean).includes(providerAccountId)
}
