import type { CommandDefinition } from '../macro/types'
import { commands } from '../../data/commands/commands'

// 辞書はドメインデータ。UI 文言や個別コマンド知識をここ以外へ散らさない（AGENTS.md）。
export function getDictionary(): CommandDefinition[] {
  return commands
}

export function findCommand(
  token: string,
  dictionary: CommandDefinition[] = commands,
): CommandDefinition | undefined {
  const normalized = token.toLowerCase()
  return dictionary.find((command) =>
    command.names.some((name) => name.toLowerCase() === normalized),
  )
}

// `/a` の途中入力から、正式名・短縮名を前方一致で候補にする（SPEC.md 補完とチップヘルプ）。
export function suggestCommands(
  partial: string,
  dictionary: CommandDefinition[] = commands,
): CommandDefinition[] {
  const normalized = partial.toLowerCase()
  if (!normalized.startsWith('/')) return []
  return dictionary.filter((command) =>
    command.names.some((name) => name.toLowerCase().startsWith(normalized)),
  )
}
