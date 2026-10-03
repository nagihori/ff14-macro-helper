import { Marked, type Tokens } from 'marked'

// 記事の Markdown を HTML にする。書くのは自分（リポジトリの中のファイル）だが、あとで誰かが記事を足す可能性も考えて、安全側に倒す：
//  - 本文に直接書いた HTML は、タグとして通さず文字として出す
//  - リンク・画像の URL は、http(s)・mailto・サイト内のパス・#アンカーだけ。それ以外（javascript: など）は、リンクにしない
//  - 外部へのリンクは、別タブで開き、noopener を付ける
const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const isSafeUrl = (href: string) => /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href.trim())
const isExternal = (href: string) => /^https?:\/\//i.test(href.trim())

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(text)
    },
    link({ href, title, tokens }: Tokens.Link) {
      const inner = this.parser.parseInline(tokens)
      if (!isSafeUrl(href)) return inner
      const attrs = [`href="${escapeHtml(href)}"`, title ? `title="${escapeHtml(title)}"` : '', isExternal(href) ? 'target="_blank" rel="noopener noreferrer"' : ''].filter(Boolean).join(' ')
      return `<a ${attrs}>${inner}</a>`
    },
    image({ href, title, text }: Tokens.Image) {
      if (!isSafeUrl(href) || href.trim().startsWith('mailto:')) return escapeHtml(text)
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy">`
    },
  },
})

export function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false })
}
