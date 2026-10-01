// 画面をまたいで使うボタン文言の単一の定義。対応表は docs/ui-text.md。
// 方針：対象を明示する（「マクロテキストをコピー」「URLをコピー」）。対象が無い場面だけ「〇〇する」。
export const UI_TEXT = {
  copyMacro: 'マクロテキストをコピー',
  copyShareUrl: '共有URLをコピー',
  copyPageUrl: 'URLをコピー',
  // 共有シートが使える端末（スマホなど）では、コピーではなく共有になるのでこちらを使う。
  share: 'URLを共有',
  editInEditor: 'エディタで編集',
  preview: '動作プレビュー',
  copied: 'コピーしました',
  copyFailed: 'コピーできませんでした',
} as const

// 操作帯（コードブロック上部）の短いキャプション。
export const BAR_TEXT = {
  copy: 'copy',
  share: 'share',
  preview: 'preview',
  edit: 'edit',
} as const
