import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isRememberablePath, recallLibraryPath, rememberLibraryPath } from './tab-memory'

describe('タブの記憶', () => {
  const data = new Map<string, string>()
  beforeEach(() => {
    data.clear()
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v) }, removeItem: (k: string) => { data.delete(k) } })
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('ライブラリ配下のページだけ覚える（フィードなどは覚えない）', () => {
    expect(isRememberablePath('/macros')).toBe(true)
    expect(isRememberablePath('/macros/submit')).toBe(true)
    expect(isRememberablePath('/macros/tag/%E8%A3%BD%E4%BD%9C')).toBe(true)
    expect(isRememberablePath('/')).toBe(false)
    expect(isRememberablePath('/terms')).toBe(false)
    expect(isRememberablePath('/macros/feed.xml')).toBe(false)
    expect(isRememberablePath('/macrosX')).toBe(false)
  })
  it('覚えて、思い出せる。覚えられないページを渡しても、前のまま', () => {
    expect(recallLibraryPath()).toBeNull()
    rememberLibraryPath('/macros/submit')
    expect(recallLibraryPath()).toBe('/macros/submit')
    rememberLibraryPath('/terms')
    expect(recallLibraryPath()).toBe('/macros/submit')
  })
  it('壊れた値は返さない・sessionStorage が使えなくても例外を出さない', () => {
    data.set('ff14-macro-last-library-path', 'https://evil.example/')
    expect(recallLibraryPath()).toBeNull()
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } })
    expect(() => rememberLibraryPath('/macros')).not.toThrow()
    expect(recallLibraryPath()).toBeNull()
  })
})
