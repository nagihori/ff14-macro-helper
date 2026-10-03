// 本文の HTML コメント（<!-- … -->）を取り除く。下書きの中の「あとで直す」メモや、書きかけの部分を、記事に出さないため。
// （記事では、直接書いた HTML は文字として出す方針なので、コメントをそのまま通すと、コメントの文字が見えてしまう。）
// コードブロック（``` で囲んだ範囲）と、インラインのコード（`…`）の中は、書き方の例なので、触らない。
// 閉じていないコメント（<!-- だけ）は、間違いに気づけるよう、そのまま残す。
const FENCE = /^ {0,3}(`{3,}|~{3,})/
const INLINE_CODE = /(?<!`)(`+)(?!`)[^`\n]+?\1(?!`)/g

export function stripHtmlComments(body: string): string {
  const out: string[] = []
  let plain: string[] = []
  let fence: string | null = null
  const flushPlain = () => {
    if (plain.length === 0) return
    out.push(stripInPlain(plain.join('\n')))
    plain = []
  }
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(FENCE)
    if (fence === null) {
      if (match) {
        flushPlain()
        fence = match[1][0]
        out.push(line)
      } else {
        plain.push(line)
      }
    } else {
      out.push(line)
      if (match && match[1][0] === fence) fence = null
    }
  }
  flushPlain()
  return out.join('\n')
}

// コードブロックの外側の文字列から、コメントを消す。インラインのコードは、いったん目印に置き換えて守る。
function stripInPlain(text: string): string {
  const saved: string[] = []
  const guarded = text.replace(INLINE_CODE, (code) => {
    saved.push(code)
    return `\u0000${saved.length - 1}\u0000`
  })
  // コメントだけの行が消えたあとに、空行が続きすぎないようにする。
  const stripped = guarded.replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n')
  return stripped.replace(/\u0000(\d+)\u0000/g, (_, index) => saved[Number(index)])
}
