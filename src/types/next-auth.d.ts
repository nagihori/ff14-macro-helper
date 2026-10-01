import type { DefaultSession } from 'next-auth'

// セッションに載せる項目。Discord の ID・表示名・アバターは載せない。
declare module 'next-auth' {
  interface Session {
    user: { id: string; isAdmin: boolean } & DefaultSession['user']
  }
}
