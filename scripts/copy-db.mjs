// 別の DB（本番など）の users / macros を、DATABASE_URL の DB へ丸ごとコピーする。テスト用。
// コピー元は読み取りしかしない。コピー先の既存データは消えるので、先に --backup のファイルへ書き出す。
// 使い方: SOURCE_DATABASE_URL=... node --env-file=.env.local scripts/copy-db.mjs --backup <退避先.json>
// 注意: users には Discord の ID と表示名が入る。コピー先は開発用 DB に限り、他へ持ち出さない。
import { writeFile } from 'node:fs/promises'
import { Pool } from '@neondatabase/serverless'

const source = process.env.SOURCE_DATABASE_URL
const target = process.env.DATABASE_URL
const backupPath = process.argv[process.argv.indexOf('--backup') + 1]
if (!source || !target) throw new Error('SOURCE_DATABASE_URL と DATABASE_URL の両方が必要')
if (!process.argv.includes('--backup') || !backupPath) throw new Error('--backup <退避先.json> が必要')
if (new URL(source).host === new URL(target).host) throw new Error('コピー元とコピー先が同じ DB')

const src = new Pool({ connectionString: source })
const dst = new Pool({ connectionString: target })

const read = async (pool, table) => (await pool.query(`select * from ${table}`)).rows
const [users, macros] = [await read(src, 'users'), await read(src, 'macros')]

// コピー先の現状を退避（取り返しがつくように）
await writeFile(backupPath, JSON.stringify({ users: await read(dst, 'users'), macros: await read(dst, 'macros') }, null, 2))

const insert = async (client, table, rows) => {
  for (const row of rows) {
    const keys = Object.keys(row)
    await client.query(
      `insert into ${table} (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')})`,
      keys.map((key) => row[key]),
    )
  }
}

const client = await dst.connect()
try {
  await client.query('begin')
  await client.query('truncate macros, users cascade')
  await insert(client, 'users', users)
  // アレンジ元の自己参照は、全行を入れてから張る
  await insert(client, 'macros', macros.map((row) => ({ ...row, arranged_from: null })))
  for (const row of macros.filter((r) => r.arranged_from)) {
    await client.query('update macros set arranged_from = $1 where id = $2', [row.arranged_from, row.id])
  }
  await client.query('commit')
  console.log(`copied users=${users.length} macros=${macros.length}`)
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  client.release()
  await src.end()
  await dst.end()
}
