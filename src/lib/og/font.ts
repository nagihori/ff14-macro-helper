// OGP 画像用の日本語フォント。同梱せず（ImageResponse の 500KB 上限のため）、描く文字だけの部分集合を Google Fonts から取る。
// 取得に失敗したら null を返し、呼び出し側は日本語を描かない最低限のカードにする。
export async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`)).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (!url) return null
    const res = await fetch(url)
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}
