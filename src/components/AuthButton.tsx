import { auth, signIn, signOut } from '@/auth'
import { DiscordLogo } from './DiscordLogo'
import styles from './AuthButton.module.scss'

// ログイン／ログアウト。ログイン後に戻る先を redirectTo で渡す。
// ログインは Discord の公式ガイドラインに沿った Blurple のボタン（ロゴは白・変形しない）。
export async function AuthButton({ redirectTo }: { redirectTo: string }) {
  const session = await auth()
  return session ? (
    <form className={styles.form} action={async () => { 'use server'; await signOut({ redirectTo }) }}>
      <button type="submit" className={styles.logout}>ログアウト</button>
    </form>
  ) : (
    <form className={styles.form} action={async () => { 'use server'; await signIn('discord', { redirectTo }) }}>
      <button type="submit" className={styles.discord}>
        <DiscordLogo className={styles.logo} />
        Discordでログイン
      </button>
    </form>
  )
}
