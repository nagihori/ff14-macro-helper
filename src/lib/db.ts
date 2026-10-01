import { neon } from '@neondatabase/serverless'

// Neon への接続。DATABASE_URL は .env.local（本番は Vercel の環境変数）から読む。
// 呼ばれたときに作る（ビルド時に env が無くても import だけでは落ちないように）。
export function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL が未設定です。.env.example を参照してください。')
  return neon(url)
}
