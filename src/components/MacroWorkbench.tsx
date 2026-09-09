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
import { getPlaceholderCompletion } from '@/lib/macro/placeholder-completion'
import { getActiveCommand } from '@/lib/macro/active-command'
import { lineRangeAt } from '@/lib/macro/parse'
import { halfWidthLength } from '@/lib/macro/text-width'
import { MAX_LINE_LENGTH, MAX_LINES } from '@/lib/macro/lint'
import { getDictionary } from '@/lib/commands/dictionary'
import { buildShareUrl, decodeDocument, readShareParam } from '@/lib/share/url'
import type {
  CommandDefinition,
  HighlightSegmentKind,
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

const HIGHLIGHT_CLASS: Record<HighlightSegmentKind, string> = {
  'command-known': 'text-blue-600 dark:text-blue-400',
  'command-unknown': 'text-amber-600 dark:text-amber-400',
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

// UI はここでモデルを表示するだけ。文字数・構文・コマンドの意味は lib/macro が判断する（AGENTS.md）。
export function MacroWorkbench() {
  const [body, setBody] = useState('')
  const [cursor, setCursor] = useState(0)
  const [selection, setSelection] = useState<{ key: string | null; index: number }>({
    key: null,
    index: 0,
  })
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const [dismissedPlaceholderKey, setDismissedPlaceholderKey] = useState<string | null>(null)
  const [placeholderSelection, setPlaceholderSelection] = useState<{
    key: string | null
    index: number
  }>({ key: null, index: 0 })
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  const [ghostPosition, setGhostPosition] = useState<{ left: number; top: number } | null>(null)

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
  const logEntries = useMemo(() => toLogPreview(analysis.lines), [analysis.lines])
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
  const currentLineStats = useMemo(() => {
    const { start, end } = lineRangeAt(body, cursor)
    return {
      number: body.slice(0, start).split('\n').length,
      length: halfWidthLength(body.slice(start, end)),
    }
  }, [body, cursor])

  const completionKey = completion
    ? `${completion.rangeStart}:${completion.rangeEnd}:${completion.token}`
    : null
  const visibleCompletion =
    completion && !completion.isExactMatch && completionKey !== dismissedKey ? completion : null
  const selectedIndex = selection.key === completionKey ? selection.index : 0

  // ドロップダウンで選択中の候補を、入力の続きとして薄字でカーソル直後に表示する。
  // カーソルがトークン末尾にある時だけ「続きを打っている」体験として意味を持つ。
  const ghostText =
    visibleCompletion && cursor === visibleCompletion.rangeEnd
      ? resolveCompletionName(
          visibleCompletion.candidates[selectedIndex],
          visibleCompletion.token,
        ).slice(visibleCompletion.token.length)
      : ''

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

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-6 p-8 md:grid-cols-2">
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-zinc-500">エディタ</h2>
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
              {highlightLines.map((highlightLine, lineIndex) => (
                <span key={highlightLine.line}>
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
              ))}
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
            {visibleCompletion && (
            <ul className="absolute top-full left-0 z-10 mt-1 max-h-64 w-full overflow-y-auto rounded border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              {visibleCompletion.candidates.map((command, index) => (
                <li key={command.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyCompletion(command)}
                    className={`w-full px-3 py-1.5 text-left text-sm ${
                      index === selectedIndex
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : ''
                    }`}
                  >
                    <span className="font-mono font-semibold">{command.names.join(' / ')}</span>
                    <span className="ml-2 text-xs text-zinc-500">{command.signature}</span>
                    <p className="text-xs text-zinc-500">{command.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {visiblePlaceholderCompletion && (
            <ul className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
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
            )}
          </div>
        </div>
        {activeCommand && (
          <div className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
            <p className="font-mono font-semibold">{activeCommand.names.join(' / ')}</p>
            <p className="text-zinc-500">{activeCommand.signature}</p>
            <p>{activeCommand.description}</p>
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
        )}
        <div className="flex gap-2">
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
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-500">診断</h2>
          {analysis.diagnostics.length === 0 ? (
            <p className="text-sm text-zinc-400">問題は見つかりませんでした。</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {analysis.diagnostics.map((diagnostic, index) => (
                <li
                  key={`${diagnostic.code}-${diagnostic.line}-${index}`}
                  className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                >
                  <span className="font-mono text-xs text-zinc-500">
                    L{diagnostic.line} · {diagnostic.severity}
                  </span>
                  <p>{diagnostic.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-500">ログプレビュー</h2>
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {logEntries.map((entry) => (
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
        </div>
      </section>
    </div>
  )
}
