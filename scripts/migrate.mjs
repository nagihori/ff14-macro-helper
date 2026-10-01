// db/migrations/*.sql を番号順に流す最小のマイグレーション。適用済みは _migrations で記録して飛ばす。
// 使い方: node --env-file=.env.local scripts/migrate.mjs
import { readdir, readFile } from 'node:fs/promises'
import { Pool } from '@neondatabase/serverless'

const dir = new URL('../db/migrations/', import.meta.url)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

await pool.query('create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())')
const done = new Set((await pool.query('select name from _migrations')).rows.map((row) => row.name))

for (const file of (await readdir(dir)).filter((name) => name.endsWith('.sql')).sort()) {
  if (done.has(file)) continue
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
