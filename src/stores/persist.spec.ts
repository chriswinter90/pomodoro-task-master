import { describe, expect, it } from 'vitest'

import { loadFromLocalStorage, saveToLocalStorage } from './persist'
import { mockStorage } from './test-setup'

describe('saveToLocalStorage', () => {
  it('saves data as JSON string', () => {
    saveToLocalStorage('test', { foo: 'bar' })
    expect(mockStorage['test']).toBe('{"foo":"bar"}')
  })
})

describe('loadFromLocalStorage', () => {
  it('returns default when key is missing', () => {
    const result = loadFromLocalStorage('missing', () => 'default')
    expect(result).toBe('default')
  })

  it('loads and parses valid JSON', () => {
    mockStorage['data'] = JSON.stringify({ name: 'test' })
    const result = loadFromLocalStorage<{ name: string }>('data', () => ({ name: 'fallback' }))
    expect(result).toEqual({ name: 'test' })
  })

  it('returns default when data is corrupt', () => {
    mockStorage['data'] = 'not json{'
    const result = loadFromLocalStorage('data', () => 'fallback')
    expect(result).toBe('fallback')
  })

  it('applies reviver function when provided', () => {
    mockStorage['dates'] = JSON.stringify([{ ts: '2024-01-01' }])
    const result = loadFromLocalStorage('dates', () => [], raw => {
      const items = raw as { ts: string }[]
      return items.map(item => new Date(item.ts))
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(Date)
  })
})
