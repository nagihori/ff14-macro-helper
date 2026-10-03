// 画面をまたいで使うボタン文言の単一の定義。対応表は docs/ui-text.md。
// 方針：対象を明示する（「マクロテキストをコピー」「URLをコピー」）。対象が無い場面だけ「〇〇する」。
export const UI_TEXT = {
  copyMacro: 'マクロテキストをコピー',
  copyShareUrl: '共有URLをコピー',
  copyPageUrl: 'URLをコピー',
  // 共有シートが使える端末（スマホなど）では、コピーではなく共有になるのでこちらを使う。
  share: 'URLを共有',
  // 共有ボタンの ▼ で開く、ほかの共有方法。Lodestone は掲示板に貼る BB コード（色付き）。
  moreShare: 'ほかの共有方法',
  copyLodestone: 'Lodestone用にコピー',
  backToLibrary: '公開マクロ一覧へ',
  editInEditor: 'エディタで編集',
  preview: '動作プレビュー',
  // サイト全体のタブ（全ページ共通ヘッダー）。
  tabEditor: 'エディタ',
  tabLibrary: 'ライブラリ',
  // 編集中のマクロを公開する（エディタ）／新たにマクロを投稿する（ライブラリ）。
  publish: '公開する',
  submitMacro: '自作マクロを投稿',
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
