import type { CommandDefinition } from '../macro/types'
import { commands } from '../../data/commands/commands'

type SearchMatch = {
  command: CommandDefinition
  score: number
}

// コマンド名は先頭の / を付けても省略しても同じ検索語として扱い、日本語説明の検索も
// 全角・半角の揺れで取りこぼさないようにする。辞書データ自体は変更しない。
function normalizeSearchQuery(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en-US').replace(/^\/+/, '')
}

function scoreCommand(command: CommandDefinition, query: string): number | null {
  const names = command.names.map((name) => name.slice(1).toLocaleLowerCase('en-US'))
  const signature = command.signature.normalize('NFKC').toLocaleLowerCase('en-US')
  const description = command.description.normalize('NFKC').toLocaleLowerCase('en-US')
  const category = command.category.toLocaleLowerCase('en-US')

  if (names.some((name) => name === query)) return 0
  if (names.some((name) => name.startsWith(query))) return 1
  if (names.some((name) => name.includes(query))) return 2
  if (signature.includes(query)) return 3
  if (description.includes(query)) return 4
  if (category.includes(query)) return 5
  return null
}

// コマンド名・短縮名・構文・説明から逆引きし、誤って別コマンドを選びにくいよう
// コマンド名への一致を説明文への一致より上位に並べる。空の検索語では一覧を返さない。
export function searchCommands(
  query: string,
  dictionary: CommandDefinition[] = commands,
): CommandDefinition[] {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return []

  return dictionary
    .map((command): SearchMatch | null => {
      const score = scoreCommand(command, normalized)
      return score === null ? null : { command, score }
    })
    .filter((match): match is SearchMatch => match !== null)
    .sort((left, right) => left.score - right.score)
    .map(({ command }) => command)
}
