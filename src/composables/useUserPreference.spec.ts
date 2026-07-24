import { beforeEach, describe, expect, it } from 'vitest'
import { useUserPreference } from './useUserPreference'

const mockStorage: Record<string, string> = {}
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value
    },
    removeItem: (key: string) => {
      delete mockStorage[key]
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k]
    },
    get length() {
      return Object.keys(mockStorage).length
    },
    key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  },
  writable: true,
})

describe('useUserPreference', () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
  })

  it('returns fallback when key is missing', () => {
    const { value } = useUserPreference('missing', 'default')
    expect(value.value).toBe('default')
  })

  it('loads saved value from localStorage', () => {
    mockStorage['my-key'] = JSON.stringify('saved')
    const { value } = useUserPreference('my-key', 'fallback')
    expect(value.value).toBe('saved')
  })

  it('returns fallback when data is corrupt', () => {
    mockStorage['my-key'] = 'not-json{'
    const { value } = useUserPreference('my-key', 'fallback')
    expect(value.value).toBe('fallback')
  })

  it('updates reactive value and persists to localStorage on setValue', () => {
    const { value, setValue } = useUserPreference('my-key', 'fallback')
    setValue('new-value')
    expect(value.value).toBe('new-value')
    expect(mockStorage['my-key']).toBe(JSON.stringify('new-value'))
  })

  it('returns boolean fallback when key is missing', () => {
    const { value } = useUserPreference('missing-bool', true)
    expect(value.value).toBe(true)
  })

  it('loads boolean value from localStorage', () => {
    mockStorage['bool-key'] = JSON.stringify(false)
    const { value } = useUserPreference('bool-key', true)
    expect(value.value).toBe(false)
  })

  it('persists boolean value to localStorage on setValue', () => {
    const { value, setValue } = useUserPreference('bool-key', false)
    setValue(true)
    expect(value.value).toBe(true)
    expect(mockStorage['bool-key']).toBe(JSON.stringify(true))
  })
})
