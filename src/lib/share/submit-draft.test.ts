import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSubmitDraft, loadSubmitDraft, saveSubmitDraft } from './submit-draft'

// vitest は node 環境で動くので、sessionStorage を小さな代用品に差し替える。
function stubStorage(broken = false) {
  const data = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => { if (broken) throw new Error('blocked'); return data.get(key) ?? null },
    setItem: (key: string, value: string) => { if (broken) throw new Error('blocked'); data.set(key, value) },
    removeItem: (key: string) => { if (broken) throw new Error('blocked'); data.delete(key) },
  })
  return data
}

const draft = { shareUrl: 'https://example.com/?m=abc', title: 't', description: 'd', tags: 'a, b', handle: 'x' }

describe('公開フォームの入力途中の写し', () => {
  beforeEach(() => { stubStorage() })
  afterEach(() => { vi.unstubAllGlobals() })

  it('保存して読み戻せる。消すと読めない', () => {
    saveSubmitDraft(draft)
    expect(loadSubmitDraft()).toEqual(draft)
    clearSubmitDraft()
    expect(loadSubmitDraft()).toBeNull()
  })
  it('壊れた中身・足りない項目は読まない', () => {
    const data = stubStorage()
    data.set('ff14-macro-submit-draft', '{not json')
    expect(loadSubmitDraft()).toBeNull()
    data.set('ff14-macro-submit-draft', JSON.stringify({ shareUrl: 'x' }))
    expect(loadSubmitDraft()).toBeNull()
  })
  it('sessionStorage が使えなくても例外を出さない', () => {
    stubStorage(true)
    expect(() => saveSubmitDraft(draft)).not.toThrow()
    expect(loadSubmitDraft()).toBeNull()
    expect(() => clearSubmitDraft()).not.toThrow()
  })
})
