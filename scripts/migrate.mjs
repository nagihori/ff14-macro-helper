// db/migrations/*.sql を番号順に流す最小のマイグレーション。適用済みは _migrations で記録して飛ばす。
// 開発 DB: npm run db:migrate（.env.local の DATABASE_URL）
// 本番 DB: docs/publish.md の「本番 DB へのマイグレーション」を参照。先に --dry-run で対象と未適用の一覧を確かめる。
import { readdir, readFile } from 'node:fs/promises'
import { Pool } from '@neondatabase/serverless'

const dir = new URL('../db/migrations/', import.meta.url)
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL が未設定')
const dryRun = process.argv.includes('--dry-run')
// 取り違え防止：何に対して流すかを必ず先に出す（接続文字列のパスワードは出さない）。
const target = new URL(process.env.DATABASE_URL)
console.log(`対象: ${target.host}${target.pathname}${dryRun ? '（--dry-run：適用しない）' : ''}`)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

if (!dryRun) await pool.query('create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())')
// --dry-run では何も作らない。記録表がまだなければ全部が未適用。
const hasTable = (await pool.query("select to_regclass('_migrations') as t")).rows[0].t !== null
const done = new Set(hasTable ? (await pool.query('select name from _migrations')).rows.map((row) => row.name) : [])

for (const file of (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort()) {
  if (done.has(file)) continue
  if (dryRun) { console.log('未適用', file); continue }
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query(await readFile(new URL(file, dir), 'utf8'))
    await client.query('insert into _migrations (name) values ($1)', [file])
    await client.query('commit')
    console.log('applied', file)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
await pool.end()
