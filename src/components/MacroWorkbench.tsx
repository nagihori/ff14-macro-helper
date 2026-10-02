'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
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
import { searchCommands } from '@/lib/commands/search'
import { getCheckedBody, getEditorOrigin, loadStoredDraft, loadStoredOrigin, saveStoredDraft, saveStoredOrigin, setEditorDraft, setEditorOrigin, subscribeCheckedBody } from '@/lib/share/editor-draft'
import { buildShareUrl, decodeDocument, readOriginFromShareUrl, readShareParam } from '@/lib/share/url'
import type {
  CommandCategory,
  CommandDefinition,
  LogEntry,
  PlaceholderCandidate,
} from '@/lib/macro/types'
import { useMacroCheck } from './useMacroCheck'
import { ActionBar, ActionBarItem } from './ActionBar'
import { LogLegend } from './LogLegend'
import { LogList } from './LogList'
import { ActionButton } from './ActionButton'
import { ActionGroup } from './ActionGroup'
import { CopyIcon, PreviewIcon, PublishIcon, ShareIcon, WarningIcon } from './icons'
import { useCopyFeedback } from './useCopyFeedback'
import { collapseDoubleSlash } from '@/lib/macro/double-slash'
import { ariaShortcut, formatShortcut, matchShortcut } from '@/lib/shortcuts'
import { BAR_TEXT, UI_TEXT } from '@/lib/ui-text'
import styles from './MacroWorkbench.module.scss'

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

// コマンド単位ではなく行全体が対象の診断（行長・行数超過）は、行全体を波線で囲む。
// command-unknown 等トークン単位の診断は、ハイライト側（MacroWorkbench.module.scss）で個別に処理済み。
const WHOLE_LINE_DIAGNOSTIC_CODES = new Set(['line-length-exceeded', 'line-count-exceeded'])

const subscribeNothing = () => () => {}

// UI はここでモデルを表示するだけ。文字数・構文・コマンドの意味は lib/macro が判断する（AGENTS.md）。
export function MacroWorkbench() {
  // マクロは必ず「/」から書き始めるので、1行目に「/」を入れておく（?m= の共有URLやペーストで上書きされる）。
  // 触る前はコマンド補完を出さず、右側の検索の案内を読めるようにする（editorTouched）。
  const [body, setBody] = useState('/')
  const [cursor, setCursor] = useState(1)
  const [editorTouched, setEditorTouched] = useState(false)
  // ボタン押下時のチェックで問題が見つかった本文。同じ本文のあいだは最終行も確定扱いで表示し、編集すると通常に戻る。
  const checkedBody = useSyncExternalStore(subscribeCheckedBody, getCheckedBody, () => null)
  const { guard, dialog: checkDialog } = useMacroCheck()
  const router = useRouter()
  const [commandSearchQuery, setCommandSearchQuery] = useState('')
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
  const [expandedSearchCommandId, setExpandedSearchCommandId] = useState<string | null>(null)
  const [dismissedPlaceholderKey, setDismissedPlaceholderKey] = useState<string | null>(null)
  const [placeholderSelection, setPlaceholderSelection] = useState<{
    key: string | null
    index: number
  }>({ key: null, index: 0 })
  // 挿入できなかった時などの、短い知らせ。
  const [notice, setNotice] = useState<string | null>(null)
  const bodyCopy = useCopyFeedback()
  const urlCopy = useCopyFeedback()
  // クリップボードに書けなかった時の逃げ道として、共有URLをそのまま見せる。
  const [manualShareUrl, setManualShareUrl] = useState<string | null>(null)
  const isMac = useSyncExternalStore(subscribeNothing, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  const [ghostPosition, setGhostPosition] = useState<{ left: number; top: number } | null>(null)
  // 長い行は折り返すので、行番号の高さはハイライト層の各行の実測に合わせる。
  const [lineHeights, setLineHeights] = useState<number[]>([])

  // ログプレビューは常時追従ではなく「マクロ実行」を押した時点のスナップショットを
  // /wait 秒数ぶん遅延させながら1行ずつ出す（ROADMAP.md 申し送り）。
  const [logPlayback, setLogPlayback] = useState<{
    entries: LogEntry[]
    revealedCount: number
  } | null>(null)
  const logTimeoutsRef = useRef<number[]>([])
  const tabReleasedRef = useRef(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const ghostLayerRef = useRef<HTMLDivElement>(null)

  // 静的プリレンダーとの hydration 不一致を避けるため、本文の復元はマウント後の
  // 1 回だけ実行する（外部システム = URL・sessionStorage との同期という effect の正当な用途）。
  // 優先順は ?m=（共有URL）→ タブ移動前の本文（sessionStorage）→ 初期値の「/」。
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    const param = readShareParam(window.location.search)
    const result = param ? decodeDocument(param) : null
    if (result?.ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL という外部システムからのマウント時 1 回限りの復元
      setBody(result.document.body)
      // アレンジ元（from）は URL にしか載らず、タブ移動で消えるので sessionStorage にも写す。
      const origin = readOriginFromShareUrl(window.location.href)
      setEditorOrigin(origin)
      saveStoredOrigin(origin)
    } else {
      if (result) {
        setRestoreError(
          result.reason === 'unsupported-version'
            ? '共有データが未対応のバージョンです。'
            : '共有データを読み込めませんでした。',
        )
      }
      const stored = loadStoredDraft()
      if (stored !== null) setBody(stored)
      setEditorOrigin(loadStoredOrigin())
    }
    setRestored(true)
  }, [])

  // 「公開する」ボタンが最新の本文を読めるよう、写しを置いておく。
  // sessionStorage へは復元が済んでから書く（復元前に初期値の「/」で上書きしないため）。
  useEffect(() => {
    setEditorDraft(body)
    if (restored) saveStoredDraft(body)
  }, [body, restored])

  const analysis = useMemo(() => analyze(body, dictionary, { complete: checkedBody === body }), [body, checkedBody])
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
  const commandSearchResults = useMemo(
    () => searchCommands(commandSearchQuery, dictionary),
    [commandSearchQuery],
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
    editorTouched && completion && !completion.isExactMatch && completionKey !== dismissedKey ? completion : null
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

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const measure = () => {
      const heights = Array.from(overlay.children, (child) => child.getBoundingClientRect().height)
      setLineHeights((prev) =>
        prev.length === heights.length && prev.every((h, i) => h === heights[i]) ? prev : heights,
      )
    }
    measure()
    // 画面幅の変化（回転など）でも折り返しが変わる。
    const observer = new ResizeObserver(measure)
    observer.observe(overlay)
    return () => observer.disconnect()
  }, [highlightLines])

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

  // 検索結果はエディタの入力途中でなくても選べるため、補完範囲がある時は既存の
  // 置換処理を使い、それ以外では現在のカーソル位置へ正式名を挿入する。
  function applySearchCommand(command: CommandDefinition) {
    if (completion) {
      applyCompletion(command)
      return
    }

    const name = command.names[0]
    const before = body.slice(0, cursor)
    const after = body.slice(cursor)
    const separator = after.length === 0 || !/^[ \n]/.test(after) ? ' ' : ''
    const newBody = before + name + separator + after
    const { start, end } = lineRangeAt(newBody, cursor + name.length)

    if (
      newBody.split('\n').length > MAX_LINES ||
      halfWidthLength(newBody.slice(start, end)) > MAX_LINE_LENGTH
    ) {
      setNotice('コマンドを挿入するとマクロの行数または文字数の上限を超えます。')
      return
    }

    const nextCursor = cursor + name.length + separator.length
    setBody(newBody)
    setCursor(nextCursor)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  // 検索を始めた時点でプレビューを止め、右ペインを検索結果へ戻す。
  function handleCommandSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const query = event.target.value
    setCommandSearchQuery(query)
    if (query.trim()) stopLogPlayback()
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
    // ただしキーボードだけで出られるよう、候補が無い状態で Esc を押した直後の Tab だけはフォーカス移動に譲る。
    if (event.key === 'Tab') {
      if (tabReleasedRef.current) {
        tabReleasedRef.current = false
        return
      }
      event.preventDefault()
    } else if (event.key === 'Escape') {
      tabReleasedRef.current = !visibleCompletion && !visiblePlaceholderCompletion && !ghostText
    } else if (!['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
      tabReleasedRef.current = false
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

    setNotice(null)

    // 手癖の「//」は「/」に戻す（lib/macro/double-slash.ts）。変換中の入力には触らない。
    const collapsed = (event.nativeEvent as InputEvent).isComposing ? null : collapseDoubleSlash(body, newValue, newCursor)
    if (collapsed) {
      setBody(collapsed.body)
      setCursor(collapsed.cursor)
      requestAnimationFrame(() => el.setSelectionRange(collapsed.cursor, collapsed.cursor))
      return
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

  function copyBody() {
    return bodyCopy.run(() => navigator.clipboard.writeText(body))
  }

  function copyShareUrl() {
    const url = buildShareUrl(analysis.document, window.location.href, getEditorOrigin())
    return urlCopy.run(async () => {
      try {
        await navigator.clipboard.writeText(url)
        setManualShareUrl(null)
      } catch (error) {
        setManualShareUrl(url)
        throw error
      }
    })
  }

  // コピー・共有の前には必ず本文をチェックし、問題があれば確認を挟む。
  function handleCopy() { guard(body, UI_TEXT.copyMacro, copyBody) }
  function handleShare() { guard(body, UI_TEXT.copyShareUrl, copyShareUrl) }

  // 編集中の本文から共有URLを作り、公開フォームの URL 欄へ入れた状態で遷移する。
  // 現在の URL に `from`（アレンジ元）があれば、共有URLにもそのまま引き継がれる。
  function handlePublish() {
    if (!body.trim() || body.trim() === '/') return router.push('/macros/submit')
    guard(body, UI_TEXT.publish, () => {
      const shareUrl = buildShareUrl({ version: 1, body }, window.location.href, getEditorOrigin())
      router.push(`/macros/submit?url=${encodeURIComponent(shareUrl)}`)
    })
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

  const isLogPlayingNow = !!logPlayback && logPlayback.revealedCount < logPlayback.entries.length
  // Ctrl+Alt+C / P / S。最新の handler を読むため、毎回の描画で付け替える。
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const name = matchShortcut(event)
      if (!name) return
      event.preventDefault()
      if (name === 'copy') handleCopy()
      else if (name === 'share') handleShare()
      else if (!isLogPlayingNow) handlePlayLog()
    }
    // 日本語入力（変換中）でも効くよう、キャプチャ段階で受ける。キーは文字ではなく物理キー（event.code）で見る。
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  })

  const isLogPlaying = !!logPlayback && logPlayback.revealedCount < logPlayback.entries.length
  const lineLengthLevel =
    currentLineStats.length > MAX_LINE_LENGTH
      ? 'over'
      : currentLineStats.length >= LINE_LENGTH_WARNING
        ? 'near'
        : undefined

  return (
    <div className={styles.workbench}>
      {checkDialog}
      <div className={styles.panes}>
        <section className={styles.editorPane}>
          <div className={styles.editorHeader}>
            <h2 className={styles.paneTitle}>エディタ</h2>
            <div className={styles.editorTools}>
              <p className={styles.lineStats}>
                {currentLineStats.number}行目・
                <span className={styles.lineLength} data-level={lineLengthLevel}>
                  {currentLineStats.length}
                </span>
                {' / '}
                {MAX_LINE_LENGTH} 文字
              </p>
            </div>
          </div>
          {restoreError && (
            <p className={styles.restoreError} role="alert">
              {restoreError}
            </p>
          )}
          <div className={styles.editorFrame}>
            <ActionBar label="エディタの操作">
              <ActionBarItem
                icon={isLogPlaying ? <span aria-hidden className={styles.spinner} /> : <PreviewIcon />}
                caption={BAR_TEXT.preview}
                title={`${UI_TEXT.preview}（${formatShortcut('preview', isMac)}）`}
                aria-keyshortcuts={ariaShortcut('preview')}
                disabled={isLogPlaying}
                active={!!logPlayback}
                onClick={handlePlayLog}
              />
              <ActionBarItem
                icon={<CopyIcon />}
                caption={BAR_TEXT.copy}
                title={`${UI_TEXT.copyMacro}（${formatShortcut('copy', isMac)}）`}
                aria-keyshortcuts={ariaShortcut('copy')}
                feedback={bodyCopy.state}
                onClick={handleCopy}
              />
              <ActionBarItem
                icon={<ShareIcon />}
                caption={BAR_TEXT.share}
                title={`${UI_TEXT.copyShareUrl}（${formatShortcut('share', isMac)}）`}
                aria-keyshortcuts={ariaShortcut('share')}
                feedback={urlCopy.state}
                onClick={handleShare}
              />
            </ActionBar>
            <div className={styles.editorRow}>
            <div ref={gutterRef} aria-hidden className={styles.gutter}>
              {highlightLines.map((highlightLine, lineIndex) => (
                <div key={highlightLine.line} style={{ height: lineHeights[lineIndex] }}>{highlightLine.line}</div>
              ))}
            </div>
            <div className={styles.editorBody}>
              <textarea
                ref={textareaRef}
                value={body}
                onChange={handleChange}
                onFocus={() => {
                  setEditorTouched(true)
                  stopLogPlayback()
                }}
                onSelect={(event) => syncCursor(event.currentTarget)}
                onClick={(event) => syncCursor(event.currentTarget)}
                onKeyUp={(event) => syncCursor(event.currentTarget)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                rows={15}
                spellCheck={false}
                className={styles.textarea}
                placeholder={'/ac "アクション名" <t>\n/wait 1'}
              />
              <div ref={overlayRef} aria-hidden className={styles.overlay}>
                {highlightLines.map((highlightLine) => {
                  const wholeLineDiagnostic = analysis.diagnostics.find(
                    (diagnostic) =>
                      diagnostic.line === highlightLine.line &&
                      WHOLE_LINE_DIAGNOSTIC_CODES.has(diagnostic.code),
                  )
                  return (
                    <span
                      key={highlightLine.line}
                      className={styles.line}
                      data-severity={wholeLineDiagnostic?.severity}
                    >
                      {highlightLine.segments.map((segment, segmentIndex) => (
                        <span key={segmentIndex} className={styles.segment} data-kind={segment.kind}>
                          {segment.text}
                        </span>
                      ))}
                    </span>
                  )
                })}
              </div>
              <div ref={mirrorRef} aria-hidden className={styles.mirror} />
              <div ref={ghostLayerRef} aria-hidden className={styles.ghostLayer}>
                {ghostText && ghostPosition && (
                  <span
                    className={styles.ghostText}
                    style={{ left: ghostPosition.left, top: ghostPosition.top }}
                  >
                    {ghostText}
                  </span>
                )}
              </div>
            </div>
            </div>
          </div>
          <p
            className={styles.diagnosticLine}
            data-severity={currentLineDiagnostics[0]?.severity}
          >
            {currentLineDiagnostics.length > 0
              ? currentLineDiagnostics.map((diagnostic) => diagnostic.message).join('　')
              : ' '}
          </p>
          <div className={styles.actionStack}>
            <ActionGroup fill>
              <ActionButton
                icon={isLogPlaying ? <span aria-hidden className={styles.spinner} /> : <PreviewIcon />}
                variant="ghost"
                disabled={isLogPlaying}
                onClick={handlePlayLog}
                title={formatShortcut('preview', isMac)}
              >
                {isLogPlaying ? '実行中…' : UI_TEXT.preview}
              </ActionButton>
            </ActionGroup>
            <ActionGroup fill>
              <ActionButton icon={<CopyIcon />} feedback={bodyCopy.state} onClick={handleCopy} title={formatShortcut('copy', isMac)}>
                {UI_TEXT.copyMacro}
              </ActionButton>
              <ActionButton icon={<ShareIcon />} variant="secondary" feedback={urlCopy.state} onClick={handleShare} title={formatShortcut('share', isMac)}>
                {UI_TEXT.copyShareUrl}
              </ActionButton>
            </ActionGroup>
            <ActionGroup fill>
              <ActionButton icon={<PublishIcon />} variant="publish" onClick={handlePublish}>
                {UI_TEXT.publish}
              </ActionButton>
            </ActionGroup>
          </div>
          {notice && <p className={styles.status} role="status">{notice}</p>}
          {manualShareUrl && (
            <p className={styles.status}>コピーできなかったので、共有URLをここに表示します：{manualShareUrl}</p>
          )}
        </section>

        <section className={styles.sidePane}>
          <input
            type="search"
            value={commandSearchQuery}
            onChange={handleCommandSearchChange}
            placeholder="コマンドを検索（例: ac、パーティ、ターゲット）"
            aria-label="コマンドを検索"
            className={styles.searchInput}
          />
          {!logPlayback && (
            <p className={styles.legend}>
              文字色（種類名）：<span className={styles.legendCommand}>コマンド</span>・<span className={styles.legendEmote}>エモート</span>
            </p>
          )}
          {commandSearchQuery.trim() ? (
            commandSearchResults.length > 0 ? (
              <ul className={styles.suggestionList}>
                {commandSearchResults.map((command) => {
                  const isExpanded = expandedSearchCommandId === command.id
                  const sentences = splitSentences(command.description)
                  return (
                    <li key={command.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSearchCommandId((current) =>
                            current === command.id ? null : command.id,
                          )
                        }
                        onDoubleClick={() => applySearchCommand(command)}
                        className={`${styles.suggestion} ${styles.hoverable}`}
                      >
                        <span className={styles.suggestionHead}>
                          <span>
                            <span className={styles.commandName}>{command.names.join(' / ')}</span>
                            <span className={styles.signature}>{command.signature}</span>
                          </span>
                          <span className={styles.categoryBadge} data-category={command.category}>
                            {CATEGORY_LABEL[command.category]}
                          </span>
                        </span>
                        <p className={styles.suggestionSummary}>{sentences[0]}</p>
                      </button>
                      {isExpanded && (
                        <div className={styles.details}>
                          {sentences.length > 1 && (
                            <div className={styles.detailsSentences}>
                              {sentences.map((sentence, sentenceIndex) => (
                                <p key={sentenceIndex}>{sentence}</p>
                              ))}
                            </div>
                          )}
                          <p className={styles.supportLine}>
                            対応範囲：{command.support} ・{' '}
                            <a
                              href={command.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.sourceLink}
                            >
                              公式情報
                            </a>
                          </p>
                          <button
                            type="button"
                            onClick={() => applySearchCommand(command)}
                            className={styles.insertButton}
                          >
                            この候補を挿入
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className={styles.hint}>一致するコマンドがありません。</p>
            )
          ) : logPlayback ? (
            <>
            <LogList entries={logPlayback.entries.slice(0, logPlayback.revealedCount)} />
            <LogLegend entries={logPlayback.entries.slice(0, logPlayback.revealedCount)} />
            </>
          ) : (
            <>
              <p className={styles.hint}>
                コマンド名・短縮名・説明から検索できます。先頭の「/」は省略できます。エディタに直接「/」を入力しても候補が表示されます。
              </p>
              {visibleCompletion ? (
                <ul className={styles.suggestionList}>
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
                          className={styles.suggestion}
                          data-selected={index === selectedIndex || undefined}
                        >
                          <span className={styles.suggestionHead}>
                            <span>
                              <span className={styles.commandName}>{command.names.join(' / ')}</span>
                              <span className={styles.signature}>{command.signature}</span>
                            </span>
                            <span className={styles.categoryBadge} data-category={command.category}>
                              {CATEGORY_LABEL[command.category]}
                            </span>
                          </span>
                          <p className={styles.suggestionSummary}>{sentences[0]}</p>
                        </button>
                        {isExpanded && (
                          <div className={styles.details}>
                            {sentences.length > 1 && (
                              <div className={styles.detailsSentences}>
                                {sentences.map((sentence, sentenceIndex) => (
                                  <p key={sentenceIndex}>{sentence}</p>
                                ))}
                              </div>
                            )}
                            <p className={styles.supportLine}>
                              対応範囲：{command.support}
                              {command.sourceUrl && (
                                <>
                                  {' '}
                                  ・{' '}
                                  <a
                                    href={command.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.sourceLink}
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
                              className={styles.insertButton}
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
                <ul className={styles.placeholderList}>
                  {visiblePlaceholderCompletion.candidates.map((candidate, index) => (
                    <li key={candidate.insertText}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyPlaceholderCompletion(candidate)}
                        className={styles.suggestion}
                        data-selected={index === placeholderSelectedIndex || undefined}
                      >
                        <span className={styles.commandName}>{candidate.label}</span>
                        <span className={styles.signature}>{candidate.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : activeCommand ? (
                <div className={styles.commandCard}>
                  <p className={styles.suggestionHead}>
                    <span className={styles.commandName}>{activeCommand.names.join(' / ')}</span>
                    <span className={styles.categoryBadge} data-category={activeCommand.category}>
                      {CATEGORY_LABEL[activeCommand.category]}
                    </span>
                  </p>
                  <p className={styles.commandSignature}>{activeCommand.signature}</p>
                  <div className={styles.sentences}>
                    {splitSentences(activeCommand.description).map((sentence, index) => (
                      <p key={index}>{sentence}</p>
                    ))}
                  </div>
                  <p className={styles.supportLine}>
                    対応範囲：{activeCommand.support}
                    {activeCommand.sourceUrl && (
                      <>
                        {' '}
                        ・{' '}
                        <a
                          href={activeCommand.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.sourceLink}
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
