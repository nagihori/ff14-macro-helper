// <t> <tt> <me> <mo> <f> <1>〜<8> のような対象指定の短縮記法。
// ハイライトの妥当性判定と、引数補完の候補生成の両方で共有する単一の定義。
export const TARGET_SHORTHANDS = ['t', 'tt', 'me', 'mo', 'f', '1', '2', '3', '4', '5', '6', '7', '8']

export const TARGET_SHORTHAND_DESCRIPTIONS: Record<string, string> = {
  t: '現在のターゲット',
  tt: 'ターゲットのターゲット',
  me: '自分',
  mo: 'マウスオーバー対象',
  f: 'フォーカスターゲット',
  '1': 'パーティ1番目',
  '2': 'パーティ2番目',
  '3': 'パーティ3番目',
  '4': 'パーティ4番目',
  '5': 'パーティ5番目',
  '6': 'パーティ6番目',
  '7': 'パーティ7番目',
  '8': 'パーティ8番目',
}

// 対象ではなく、チャット文などに値として展開される代名詞。対象引数を持たないコマンドでも書けるので、
// <wait.s> と同じくコマンドを問わず補完する。出典: docs/draft/placeholder-mapping.md（公式 Patch 7.56）。
export const TEXT_PLACEHOLDER_DESCRIPTIONS: Record<string, string> = {
  pos: '自分のいるエリア名と座標',
  where: '<pos> と同じ（別名）',
}

// エモートコマンドの引数 motion（山括弧を使わない素の単語。発言せずモーションだけ再生する）。
export const EMOTE_MOTION_ARG = 'motion'

// <wait.s> はスキル使用可能待ちを表す特殊プレースホルダ。末尾の条件は利用者が入力する。
export const WAIT_BASE = 'wait'

// <se.1>〜<se.10> はゲーム内 SE を合図として鳴らす特殊プレースホルダ。番号は利用者が入力する。
export const SE_BASE = 'se'
