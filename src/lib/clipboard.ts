// 非同期に決まる文字列をクリップボードへコピーする。
// Safari は、クリックから時間が空いたあとの writeText を拒むので、文字列の Promise をそのまま ClipboardItem に渡す
// （クリック時点でコピーの枠だけ確保し、中身はあとから入る）。使えない環境では、待ってから writeText する。
export async function copyTextAsync(text: Promise<string>): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text.then((value) => new Blob([value], { type: 'text/plain' })) })])
    return
  }
  await navigator.clipboard.writeText(await text)
}
