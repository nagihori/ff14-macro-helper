import NextAuth from 'next-auth'
import Discord from 'next-auth/providers/discord'
import { isAdminAccountId } from '@/lib/admin'
import { getSql } from '@/lib/db'

// Discord ログイン。scope は identify のみ（メール・サーバー情報は取得しない）。
// セッションは JWT（DB アダプタなし）。アバターはセッションにも保存にも載せない（プライバシーポリシーの約束）。
// 管理者は ADMIN_DISCORD_IDS で判定する（src/lib/admin.ts）。

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Discord({ authorization: { params: { scope: 'identify' } } })],
  session: { strategy: 'jwt' },
  callbacks: {
    // 初回ログインで users に作り、表示名は内部用に更新しておく。公開名とは別物。
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const providerAccountId = account.providerAccountId
        const displayName = (profile.global_name as string | null | undefined) ?? (profile.username as string | undefined) ?? null
        const rows = await getSql().query(
          `insert into users (provider, provider_account_id, display_name) values ($1, $2, $3)
           on conflict (provider, provider_account_id) do update set display_name = excluded.display_name
           returning id`,
          [account.provider, providerAccountId, displayName],
        )
        token.userId = rows[0].id as string
        token.isAdmin = isAdminAccountId(providerAccountId)
      }
      // アバターと表示名は、ブラウザに持たせるトークンへ残さない。
      delete token.picture
      delete token.name
      delete token.email
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.isAdmin = token.isAdmin === true
      return session
    },
  },
})
