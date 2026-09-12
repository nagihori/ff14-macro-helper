'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { analyze } from '@/lib/macro/analyze'
import { toLogPreview } from '@/lib/macro/log-preview'
import { buildHighlight } from '@/lib/macro/highlight'
import {
  applyCompletion as applyCompletionEdit,
  getCompletionState,
  resolveCompletionName,
} from '@/lib/macro/completion'
import { getEmoteMotionGhost, getPlaceholderCompletion } from '@/lib/macro/placeholder-completion'
import { getActiveCommand } from '@/lib/macro/active-command'
import { lineRangeAt } from '@/lib/macro/parse'
import { halfWidthLength } from '@/lib/macro/text-width'
import { MAX_LINE_LENGTH, MAX_LINES } from '@/lib/macro/lint'
import { getDictionary } from '@/lib/commands/dictionary'
import { buildShareUrl, decodeDocument, readShareParam } from '@/lib/share/url'
import type {
  CommandCategory,
  CommandDefinition,
  DiagnosticSeverity,
  HighlightSegmentKind,
  LogEntry,
  LogEntryKind,
  PlaceholderCandidate,
} from '@/lib/macro/types'

const dictionary = getDictionary()

// 実際のエラーになる前に気づけるよう、180 文字制限に近づいたら早めに警告色を出す（UI 表示のみのしきい値）。
const LINE_LENGTH_WARNING = 170

// 隠しミラー要素にカーソル手前までのテキストを流し込み、マーカーの座標からキャレットの
// 画面上位置を測る（textarea 自体は文字色を透明にしているため、位置を直接読めない）。
function measureCaretOffset(
  mirror: HTMLDivElement,
  text: string,
  position: number,
): { left: number; top: number } {
  mirror.textContent = ''
  mirror.appendChild(document.createTextNode(text.slice(0, position)))
  const marker = document.createElement('span')
  marker.textContent = String.fromCharCode(0x200b) // ゼロ幅スペース。空の span だと座標が不安定なため。
  mirror.appendChild(marker)

  const mirrorRect = mirror.getBoundingClientRect()
  const markerRect = marker.getBoundingClientRect()
  return { left: markerRect.left - mirrorRect.left, top: markerRect.top - mirrorRect.top }
}

// 辞書の description は「。」区切りの文を連結した1本の文字列（AGENTS.md により
// UI 側でコマンド知識を持たないための表現）。一覧では最初の1文だけを要約として見せ、
// 展開時は文ごとに改行して読みやすくする（表示上の整形のみで、内容は増減させない）。
function splitSentences(description: string): string[] {
  return description
    .split('。')
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
    .map((sentence) => `${sentence}。`)
}

// カテゴリ名の日本語表示。サジェスト一覧の右肩バッジ用（AGENTS.md 的には
// UI に個別コマンド知識を持たせない方針だが、これはコマンド辞書の category
// 列挙に対する表示用ラベルなので、辞書側の知識を増やすものではない）。
const CATEGORY_LABEL: Record<CommandCategory, string> = {
  chat: 'チャット',
  party_social: 'パーティ/ソーシャル',
  target: '対象',
  action_hotbar: 'アクション/ホットバー',
  battle: 'バトル',
  system: 'システム',
  macro: 'マクロ専用',
  config: 'コンフィグ',
  emote: 'エモート',
  menu: 'メニュー',
  pronoun: '代名詞',
}

// カテゴリバッジの色。エモートだけ青緑系にして他カテゴリと見分けやすくする。
const CATEGORY_BADGE_CLASS: Record<CommandCategory, string> = {
  chat: 'text-blue-600 dark:text-blue-400',
  party_social: 'text-blue-600 dark:text-blue-400',
  target: 'text-blue-600 dark:text-blue-400',
  action_hotbar: 'text-blue-600 dark:text-blue-400',
  battle: 'text-blue-600 dark:text-blue-400',
  system: 'text-blue-600 dark:text-blue-400',
  macro: 'text-blue-600 dark:text-blue-400',
  config: 'text-blue-600 dark:text-blue-400',
  emote: 'text-teal-600 dark:text-teal-400',
  menu: 'text-blue-600 dark:text-blue-400',
  pronoun: 'text-blue-600 dark:text-blue-400',
}

const HIGHLIGHT_CLASS: Record<HighlightSegmentKind, string> = {
  'command-known': 'text-blue-600 dark:text-blue-400',
  'command-known-emote': 'text-teal-600 dark:text-teal-400',
  'command-unknown': 'text-amber-600 dark:text-amber-400 underline decoration-wavy decoration-amber-500',
  'arg-placeholder': 'text-purple-600 dark:text-purple-400',
  'arg-placeholder-wait': 'text-pink-600 dark:text-pink-400',
  'arg-placeholder-invalid': 'text-red-600 dark:text-red-400 underline decoration-wavy',
  'arg-string': 'text-emerald-600 dark:text-emerald-400',
  'arg-number': 'text-teal-600 dark:text-teal-400',
  'fullwidth-space': 'bg-red-500/40 rounded-xs',
  text: 'text-zinc-900 dark:text-zinc-50',
}

// ログプレビューの送信先チャンネル別の色分け。渚さんデフォルト配色のトークンなので
// 実機の見た目と揃えたい時はここだけ触れば済むようにしている。
const LOG_KIND_CLASS: Record<LogEntryKind, string> = {
  say: 'text-zinc-900 dark:text-zinc-50',
  yell: 'text-yellow-600 dark:text-yellow-400',
  shout: 'text-orange-600 dark:text-orange-400',
  tell: 'text-pink-600 dark:text-pink-400',
  party: 'text-cyan-500 dark:text-cyan-300',
  alliance: 'text-amber-500 dark:text-amber-300',
  freecompany: 'text-sky-400 dark:text-sky-200',
  linkshell: 'text-green-500 dark:text-green-300',
  echo: 'text-zinc-400 dark:text-zinc-500',
  action: 'text-indigo-600 dark:text-indigo-400',
  system: 'text-zinc-500 dark:text-zinc-400',
  error: 'text-red-600 dark:text-red-400',
  unknown: 'text-zinc-700 dark:text-zinc-300',
}

// コマンド単位ではなく行全体が対象の診断（行長・行数超過）は、行全体を波線で囲む。
// command-unknown 等トークン単位の診断は HIGHLIGHT_CLASS 側で個別に処理済み。
const WHOLE_LINE_DIAGNOSTIC_CODES = new Set(['line-length-exceeded', 'line-count-exceeded'])

const DIAGNOSTIC_UNDERLINE_CLASS: Record<DiagnosticSeverity, string> = {
  error: 'underline decoration-wavy decoration-red-500',
  warning: 'underline decoration-wavy decoration-amber-500',
  info: 'underline decoration-wavy decoration-zinc-400',
}

const DIAGNOSTIC_TEXT_CLASS: Record<DiagnosticSeverity, string> = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-zinc-500 dark:text-zinc-400',
}

// UI はここでモデルを表示するだけ。文字数・構文・コマンドの意味は lib/macro が判断する（AGENTS.md）。
export function MacroWorkbench() {
  // 最初から "/" を入れておくと、コマンド一覧のサジェストが最初から見える状態になる
  // （見出しや案内文を省いて、サジェストエリア自体を初期ヘルプとして使う）。
  const [body, setBody] = useState('/')
  const [cursor, setCursor] = useState(0)
  const [selection, setSelection] = useState<{ key: string | null; index: number }>({
    key: null,
    index: 0,
  })
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  // サジェストをクリックした時に、即挿入ではなくその場でヘルプ（説明・引数形式）を
  // 展開する。挿入はダブルクリックまたはキーボードの Tab/Enter に譲る。
  // key は候補リストの文脈（completionKey）で、文脈が変わったら展開状態は自然に無効化される
  // （selection と同じパターン。effect で明示的にリセットしない）。
  const [expandedSuggestion, setExpandedSuggestion] = useState<{
    key: string | null
    id: string | null
  }>({ key: null, id: null })
  const [dismissedPlaceholderKey, setDismissedPlaceholderKey] = useState<string | null>(null)
  const [placeholderSelection, setPlaceholderSelection] = useState<{
    key: string | null
    index: number
  }>({ key: null, index: 0 })
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  const [ghostPosition, setGhostPosition] = useState<{ left: number; top: number } | null>(null)

  // ログプレビューは常時追従ではなく「マクロ実行」を押した時点のスナップショットを
  // /wait 秒数ぶん遅延させながら1行ずつ出す（ROADMAP.md 申し送り）。
  const [logPlayback, setLogPlayback] = useState<{
    entries: LogEntry[]
    revealedCount: number
  } | null>(null)
  const logTimeoutsRef = useRef<number[]>([])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const ghostLayerRef = useRef<HTMLDivElement>(null)

  // 静的プリレンダーとの hydration 不一致を避けるため、URL 復元はマウント後の
  // 1 回だけ実行する（外部システム = URL との同期という effect の正当な用途）。
  useEffect(() => {
    const param = readShareParam(window.location.search)
    if (!param) return
    const result = decodeDocument(param)
    if (result.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL という外部システムからのマウント時 1 回限りの復元
      setBody(result.document.body)
    } else {
      setRestoreError(
        result.reason === 'unsupported-version'
          ? '共有データが未対応のバージョンです。'
          : '共有データを読み込めませんでした。',
      )
    }
  }, [])

  const analysis = useMemo(() => analyze(body, dictionary), [body])
  const highlightLines = useMemo(
    () => buildHighlight(analysis.lines, dictionary),
    [analysis.lines],
  )
  const completion = useMemo(
    () => getCompletionState(body, cursor, dictionary),
    [body, cursor],
  )
  const activeCommand = useMemo(
    () => getActiveCommand(body, cursor, dictionary),
    [body, cursor],
  )
  const placeholderCompletion = useMemo(
    () => getPlaceholderCompletion(body, cursor, dictionary),
    [body, cursor],
  )
  const emoteMotionGhost = useMemo(
    () => getEmoteMotionGhost(body, cursor, dictionary),
    [body, cursor],
  )
  const currentLineStats = useMemo(() => {
    const { start, end } = lineRangeAt(body, cursor)
    return {
      number: body.slice(0, start).split('\n').length,
      length: halfWidthLength(body.slice(start, end)),
    }
  }, [body, cursor])

  // カーソル行の診断だけを抜き出して1行で見せる。行全体の一覧はエディタ側の波線に譲る。
  const currentLineDiagnostics = useMemo(
    () => analysis.diagnostics.filter((diagnostic) => diagnostic.line === currentLineStats.number),
    [analysis.diagnostics, currentLineStats.number],
  )

  const completionKey = completion
    ? `${completion.rangeStart}:${completion.rangeEnd}:${completion.token}`
    : null
  const visibleCompletion =
    completion && !completion.isExactMatch && completionKey !== dismissedKey ? completion : null
  const selectedIndex = selection.key === completionKey ? selection.index : 0
  const expandedSuggestionId =
    expandedSuggestion.key === completionKey ? expandedSuggestion.id : null

  // ドロップダウンで選択中の候補を、入力の続きとして薄字でカーソル直後に表示する。
  // カーソルがトークン末尾にある時だけ「続きを打っている」体験として意味を持つ。
  // エモートの motion 引数も候補が1つしかないため、同じゴースト表示に相乗りさせる
  // （両者は入力位置が異なるので同時に発生しない）。
  const ghostText =
    visibleCompletion && cursor === visibleCompletion.rangeEnd
      ? resolveCompletionName(
          visibleCompletion.candidates[selectedIndex],
          visibleCompletion.token,
        ).slice(visibleCompletion.token.length)
      : (emoteMotionGhost?.remainder ?? '')

  const placeholderKey = placeholderCompletion
    ? `${placeholderCompletion.rangeStart}:${placeholderCompletion.rangeEnd}`
    : null
  const visiblePlaceholderCompletion =
    !visibleCompletion && placeholderCompletion && placeholderKey !== dismissedPlaceholderKey
      ? placeholderCompletion
      : null
  const placeholderSelectedIndex =
    placeholderSelection.key === placeholderKey ? placeholderSelection.index : 0

  // ゴーストの文字色は決まっても、画面上の座標は DOM を測らないと分からない
  // （textarea 自体は文字を透明にしていて、レイアウト情報を直接読めないため）。
  useLayoutEffect(() => {
    if (!ghostText || !mirrorRef.current) {
      setGhostPosition(null)
      return
    }
    setGhostPosition(measureCaretOffset(mirrorRef.current, body, cursor))
  }, [ghostText, body, cursor])

  function syncCursor(el: HTMLTextAreaElement) {
    setCursor(el.selectionStart)
  }

  function applyCompletion(command: CommandDefinition) {
    if (!completion) return
    const { body: newBody, cursor: nextCursor } = applyCompletionEdit(body, completion, command)
    setBody(newBody)
    setCursor(nextCursor)
    // 本文の再描画後でないと新しいカーソル位置を反映できないため、次フレームで選択範囲を合わせる。
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  function applyPlaceholderCompletion(candidate: PlaceholderCandidate) {
    if (!placeholderCompletion) return
    const { rangeStart, rangeEnd } = placeholderCompletion
    const newBody = body.slice(0, rangeStart) + candidate.insertText + body.slice(rangeEnd)
    const nextCursor = rangeStart + candidate.caretOffset
    setBody(newBody)
    setCursor(nextCursor)
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  // 改行後に続く行が空になる時だけ "/" を補い、次の行もすぐコマンドを打てるようにする。
  function computeEnterInsertion(after: string): string {
    const currentLineEndInAfter = after.indexOf('\n')
    const restOfCurrentLine =
      currentLineEndInAfter === -1 ? after : after.slice(0, currentLineEndInAfter)
    return restOfCurrentLine.length === 0 ? '\n/' : '\n'
  }

  function handleEnterForNewLine(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    event.preventDefault()
    if (analysis.lines.length >= MAX_LINES) return

    const el = event.currentTarget
    const before = body.slice(0, el.selectionStart)
    const after = body.slice(el.selectionEnd)
    const insertion = computeEnterInsertion(after)
    const newBody = before + insertion + after
    const nextCursor = before.length + insertion.length

    setBody(newBody)
    setCursor(nextCursor)
    requestAnimationFrame(() => el.setSelectionRange(nextCursor, nextCursor))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Tab はサジェスト確定専用のキーとして扱い、フォーカスが次の要素へ漏れないよう常に奪う。
    // サジェストが無い時に既定のフォーカス移動へ抜けると、確定できたかどうかが分かりにくいため。
    if (event.key === 'Tab') {
      event.preventDefault()
    }

    // 直前の行が未入力の "/" だけなら、コマンド補完候補が出ていても連続 Enter を
    // 「自動挿入した "/" を打ち消して空行を挟む」操作として優先する。空行を挟んだ後の
    // 新しい行は、通常の Enter と同じく空なら "/" を補う。
    if (event.key === 'Enter' && !(event.nativeEvent as KeyboardEvent).isComposing) {
      const el = event.currentTarget
      const before = body.slice(0, el.selectionStart)
      const after = body.slice(el.selectionEnd)
      const prevLineStart = before.lastIndexOf('\n') + 1
      const prevLineContent = before.slice(prevLineStart)
      const cursorAtLineEnd = after.length === 0 || after[0] === '\n'

      if (prevLineContent === '/' && cursorAtLineEnd) {
        event.preventDefault()
        if (analysis.lines.length >= MAX_LINES) return
        const clearedBefore = before.slice(0, prevLineStart)
        const insertion = computeEnterInsertion(after)
        const newBody = clearedBefore + insertion + after
        const nextCursor = clearedBefore.length + insertion.length
        setBody(newBody)
        setCursor(nextCursor)
        requestAnimationFrame(() => el.setSelectionRange(nextCursor, nextCursor))
        return
      }
    }

    if (visibleCompletion) {
      const candidates = visibleCompletion.candidates
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelection({ key: completionKey, index: (selectedIndex + 1) % candidates.length })
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelection({
          key: completionKey,
          index: (selectedIndex - 1 + candidates.length) % candidates.length,
        })
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        applyCompletion(candidates[selectedIndex])
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setDismissedKey(completionKey)
      }
      return
    }

    // コマンド名が既に正式名・短縮名と完全一致している時は一覧を出す意味がないが、
    // Tab を押したら候補確定と同じ区切りスペースだけ補う（サジェスト採用時と挙動を揃える）。
    if (completion?.isExactMatch && event.key === 'Tab') {
      applyCompletion(completion.candidates[0])
      return
    }

    // motion はゴースト表示のみで一覧を出さないため、確定は Tab 限定。
    // Enter はここで奪わず素通りさせ、末尾に改行できるようにする。
    if (emoteMotionGhost && event.key === 'Tab') {
      event.preventDefault()
      const { rangeEnd, remainder } = emoteMotionGhost
      const newBody = body.slice(0, rangeEnd) + remainder + body.slice(rangeEnd)
      const nextCursor = rangeEnd + remainder.length
      setBody(newBody)
      setCursor(nextCursor)
      requestAnimationFrame(() => textareaRef.current?.setSelectionRange(nextCursor, nextCursor))
      return
    }

    if (visiblePlaceholderCompletion) {
      const candidates = visiblePlaceholderCompletion.candidates
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setPlaceholderSelection({
          key: placeholderKey,
          index: (placeholderSelectedIndex + 1) % candidates.length,
        })
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setPlaceholderSelection({
          key: placeholderKey,
          index: (placeholderSelectedIndex - 1 + candidates.length) % candidates.length,
        })
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        applyPlaceholderCompletion(candidates[placeholderSelectedIndex])
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setDismissedPlaceholderKey(placeholderKey)
      }
      return
    }

    if (event.key === 'Enter' && !(event.nativeEvent as KeyboardEvent).isComposing) {
      handleEnterForNewLine(event)
    }
  }

  // 行数・行長の上限を超える追加編集はブロックする（実機のマクロエディタに近い挙動）。
  // 削除・同サイズ以下の置換は常に許可し、入力に詰まらないようにする。
  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = event.target
    const newValue = el.value
    const newCursor = el.selectionStart

    if (newValue.length > body.length) {
      const { start, end } = lineRangeAt(newValue, newCursor)
      const newLineLength = halfWidthLength(newValue.slice(start, end))
      const newLineCount = newValue.split('\n').length

      if (newLineLength > MAX_LINE_LENGTH || newLineCount > MAX_LINES) {
        el.value = body
        el.setSelectionRange(cursor, cursor)
        return
      }
    }

    setBody(newValue)
    syncCursor(el)
  }

  function handleScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = event.currentTarget.scrollTop
      overlayRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = event.currentTarget.scrollTop
    }
    if (ghostLayerRef.current) {
      ghostLayerRef.current.scrollTop = event.currentTarget.scrollTop
      ghostLayerRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(body)
      setShareStatus('コピーしました。')
    } catch {
      setShareStatus('コピーに失敗しました。')
    }
  }

  async function handleShare() {
    const url = buildShareUrl(analysis.document, window.location.href)
    try {
      await navigator.clipboard.writeText(url)
      setShareStatus('共有 URL をコピーしました。')
    } catch {
      setShareStatus(url)
    }
  }

  // クリック時点のスナップショットを、行ごとの delaySeconds（/wait の累積）だけ
  // 遅らせながら1行ずつ出す。実行中に再クリックされたら前回分のタイマーは破棄する。
  function handlePlayLog() {
    logTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
    logTimeoutsRef.current = []

    const entries = toLogPreview(analysis.lines)
    setLogPlayback({ entries, revealedCount: entries.length > 0 ? 1 : 0 })

    entries.forEach((entry, index) => {
      if (index === 0) return
      const id = window.setTimeout(() => {
        setLogPlayback((prev) =>
          prev ? { ...prev, revealedCount: Math.max(prev.revealedCount, index + 1) } : prev,
        )
      }, entry.delaySeconds * 1000)
      logTimeoutsRef.current.push(id)
    })
  }

  useEffect(() => {
    return () => {
      logTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  // 本文が変わる、またはエディタへフォーカスが戻ったら、右カラムをログ再生から
  // サジェストへ戻す（実行中のタイマーも破棄）。カーソルを合わせただけでは本文は
  // 変わらないため、フォーカス側のトリガーも別途必要（「戻り方が分かりづらい」対策）。
  function stopLogPlayback() {
    setLogPlayback((prev) => {
      if (!prev) return prev
      logTimeoutsRef.current.forEach((id) => window.clearTimeout(id))
      logTimeoutsRef.current = []
      return null
    })
  }

  useEffect(() => {
    stopLogPlayback()
  }, [body])

  const isLogPlaying = !!logPlayback && logPlayback.revealedCount < logPlayback.entries.length

  return (
    <div className="w-full max-w-5xl px-8 pb-8">
      <div className="flex gap-2 pb-6">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black"
        >
          コピー
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          共有 URL をコピー
        </button>
        {shareStatus && <p className="self-center text-sm text-zinc-500">{shareStatus}</p>}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-500">エディタ</h2>
          <div className="flex items-baseline gap-3">
            <p className="font-mono text-xs text-zinc-500">
              L{currentLineStats.number}・
              <span
                className={
                  currentLineStats.length > MAX_LINE_LENGTH
                    ? 'text-red-600 dark:text-red-400'
                    : currentLineStats.length >= LINE_LENGTH_WARNING
                      ? 'text-orange-600 dark:text-orange-400'
                      : ''
                }
              >
                {currentLineStats.length}
              </span>
              {' / '}
              {MAX_LINE_LENGTH} 文字（推定・半角換算）
            </p>
            <button
              type="button"
              onClick={handlePlayLog}
              disabled={isLogPlaying}
              className="flex items-center gap-1.5 rounded bg-black px-3 py-1 text-xs text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {isLogPlaying && (
                <span
                  aria-hidden
                  className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              )}
              {isLogPlaying ? '実行中…' : 'プレビュー'}
            </button>
          </div>
        </div>
        {restoreError && (
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800" role="alert">
            {restoreError}
          </p>
        )}
        <div className="flex flex-1 rounded border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div
            ref={gutterRef}
            aria-hidden
            className="select-none overflow-hidden border-r border-zinc-200 px-2 py-3 text-right font-mono text-sm leading-6 text-zinc-400 dark:border-zinc-800"
          >
            {highlightLines.map((highlightLine) => (
              <div key={highlightLine.line}>{highlightLine.line}</div>
            ))}
          </div>
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={handleChange}
              onFocus={stopLogPlayback}
              onSelect={(event) => syncCursor(event.currentTarget)}
              onClick={(event) => syncCursor(event.currentTarget)}
              onKeyUp={(event) => syncCursor(event.currentTarget)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              rows={15}
              spellCheck={false}
              className="relative w-full flex-1 bg-transparent p-3 font-mono text-sm leading-6 text-transparent caret-black whitespace-pre-wrap dark:caret-white"
              placeholder={'/ac "アクション名" <t>\n/wait 1'}
            />
            <div
              ref={overlayRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden p-3 font-mono text-sm leading-6 whitespace-pre-wrap"
            >
              {highlightLines.map((highlightLine, lineIndex) => {
                const wholeLineDiagnostic = analysis.diagnostics.find(
                  (diagnostic) =>
                    diagnostic.line === highlightLine.line &&
                    WHOLE_LINE_DIAGNOSTIC_CODES.has(diagnostic.code),
                )
                return (
                  <span
                    key={highlightLine.line}
                    className={
                      wholeLineDiagnostic
                        ? DIAGNOSTIC_UNDERLINE_CLASS[wholeLineDiagnostic.severity]
                        : undefined
                    }
                  >
                    {highlightLine.segments.map((segment, segmentIndex) => (
                      <span
                        key={segmentIndex}
                        className={HIGHLIGHT_CLASS[segment.kind]}
                      >
                        {segment.text}
                      </span>
                    ))}
                    {lineIndex < highlightLines.length - 1 ? '\n' : null}
                  </span>
                )
              })}
            </div>
            <div
              ref={mirrorRef}
              aria-hidden
              className="invisible absolute inset-0 overflow-hidden p-3 font-mono text-sm leading-6 whitespace-pre-wrap"
            />
            <div
              ref={ghostLayerRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {ghostText && ghostPosition && (
                <span
                  className="absolute font-mono text-sm leading-6 whitespace-pre text-zinc-400 dark:text-zinc-600"
                  style={{ left: ghostPosition.left, top: ghostPosition.top }}
                >
                  {ghostText}
                </span>
              )}
            </div>
          </div>
        </div>
        <p
          className={`h-5 truncate px-1 text-sm ${
            currentLineDiagnostics.length > 0
              ? DIAGNOSTIC_TEXT_CLASS[currentLineDiagnostics[0].severity]
              : 'text-transparent'
          }`}
        >
          {currentLineDiagnostics.length > 0
            ? currentLineDiagnostics.map((diagnostic) => diagnostic.message).join('　')
            : ' '}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        {logPlayback ? (
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {logPlayback.entries.slice(0, logPlayback.revealedCount).map((entry) => (
              <li key={entry.line} className={LOG_KIND_CLASS[entry.kind]}>
                <span className="text-zinc-400">[{entry.timestamp}]</span>{' '}
                {entry.segments.map((segment, index) =>
                  segment.kind === 'placeholder' ? (
                    <span
                      key={index}
                      className="rounded bg-purple-100 px-1 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    >
                      {segment.text}
                    </span>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </li>
            ))}
          </ul>
        ) : (
          <>
            {/* 最終的にはコマンド逆引き検索になる予定の枠。まだ検索は未配線。 */}
            <input
              type="text"
              disabled
              placeholder="コマンドを検索（準備中）"
              className="w-full rounded border border-zinc-300 bg-transparent px-3 py-1.5 text-sm text-zinc-400 placeholder:text-zinc-400 dark:border-zinc-700"
            />
            {visibleCompletion ? (
          <ul className="max-h-64 overflow-y-auto rounded border border-zinc-300 dark:border-zinc-700">
            {visibleCompletion.candidates.map((command, index) => {
              const isExpanded = expandedSuggestionId === command.id
              const sentences = splitSentences(command.description)
              return (
                <li key={command.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      setExpandedSuggestion((prev) =>
                        prev.key === completionKey && prev.id === command.id
                          ? { key: completionKey, id: null }
                          : { key: completionKey, id: command.id },
                      )
                    }
                    onDoubleClick={() => applyCompletion(command)}
                    className={`w-full px-3 py-1.5 text-left text-sm ${
                      index === selectedIndex ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span>
                        <span className="font-mono font-semibold">{command.names.join(' / ')}</span>
                        <span className="ml-2 text-xs text-zinc-500">{command.signature}</span>
                      </span>
                      <span
                        className={`shrink-0 text-xs font-semibold ${CATEGORY_BADGE_CLASS[command.category]}`}
                      >
                        {CATEGORY_LABEL[command.category]}
                      </span>
                    </span>
                    <p className="text-xs text-zinc-500">{sentences[0]}</p>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                      {sentences.length > 1 && (
                        <div className="mb-1.5 flex flex-col gap-0.5 text-zinc-700 dark:text-zinc-300">
                          {sentences.map((sentence, sentenceIndex) => (
                            <p key={sentenceIndex}>{sentence}</p>
                          ))}
                        </div>
                      )}
                      <p className="text-zinc-500">
                        対応範囲：{command.support}
                        {command.sourceUrl && (
                          <>
                            {' '}
                            ・{' '}
                            <a
                              href={command.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                              onMouseDown={(event) => event.stopPropagation()}
                            >
                              公式情報
                            </a>
                          </>
                        )}
                      </p>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyCompletion(command)}
                        className="mt-1.5 rounded border border-zinc-300 px-2 py-1 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        この候補を挿入
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : visiblePlaceholderCompletion ? (
          <ul className="overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
            {visiblePlaceholderCompletion.candidates.map((candidate, index) => (
              <li key={candidate.insertText}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyPlaceholderCompletion(candidate)}
                  className={`w-full px-3 py-1.5 text-left text-sm ${
                    index === placeholderSelectedIndex ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                  }`}
                >
                  <span className="font-mono font-semibold">{candidate.label}</span>
                  <span className="ml-2 text-xs text-zinc-500">{candidate.description}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : activeCommand ? (
          <div className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
            <p className="flex items-baseline justify-between gap-2">
              <span className="font-mono font-semibold">{activeCommand.names.join(' / ')}</span>
              <span
                className={`shrink-0 text-xs font-semibold ${CATEGORY_BADGE_CLASS[activeCommand.category]}`}
              >
                {CATEGORY_LABEL[activeCommand.category]}
              </span>
            </p>
            <p className="text-zinc-500">{activeCommand.signature}</p>
            <div className="flex flex-col gap-0.5">
              {splitSentences(activeCommand.description).map((sentence, index) => (
                <p key={index}>{sentence}</p>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              対応範囲：{activeCommand.support}
              {activeCommand.sourceUrl && (
                <>
                  {' '}
                  ・{' '}
                  <a
                    href={activeCommand.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    公式情報
                  </a>
                </>
              )}
            </p>
          </div>
            ) : null}
          </>
        )}
      </section>
      </div>
    </div>
  )
}
