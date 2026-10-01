import { describe, expect, it } from 'vitest'
import { collapseDoubleSlash } from './double-slash'

describe('collapseDoubleSlash', () => {
  it('自動で入った「/」の直後に「/」を打つと「/」ひとつに戻す', () => {
    expect(collapseDoubleSlash('/', '//', 2)).toEqual({ body: '/', cursor: 1 })
    expect(collapseDoubleSlash('/p a\n/', '/p a\n//', 7)).toEqual({ body: '/p a\n/', cursor: 6 })
    expect(collapseDoubleSlash('/', '/／', 2)).toEqual({ body: '/', cursor: 1 })
  })

  it('行の途中の「/」・貼り付け・削除・通常の入力には触らない', () => {
    expect(collapseDoubleSlash('/p a', '/p a/', 5)).toBeNull()
    expect(collapseDoubleSlash('/', '//foo', 5)).toBeNull()
    expect(collapseDoubleSlash('//', '/', 1)).toBeNull()
    expect(collapseDoubleSlash('/', '/p', 2)).toBeNull()
  })
})
