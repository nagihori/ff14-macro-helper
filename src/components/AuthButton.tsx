import { auth, signIn, signOut } from '@/auth'
import styles from './AuthButton.module.scss'

// ヘッダー用のログイン／ログアウト。ログイン後に戻る先を redirectTo で渡す。
export async function AuthButton({ redirectTo }: { redirectTo: string }) {
  const session = await auth()
  return session ? (
    <form className={styles.form} action={async () => { 'use server'; await signOut({ redirectTo }) }}>
      <button type="submit" className={styles.button}>ログアウト</button>
    </form>
  ) : (
    <form className={styles.form} action={async () => { 'use server'; await signIn('discord', { redirectTo }) }}>
      <button type="submit" className={styles.button}>Discord でログイン</button>
    </form>
  )
}
