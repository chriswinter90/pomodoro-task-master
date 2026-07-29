import { createPinia } from 'pinia'
import { nextTick, reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import './test-setup'

describe('useInactivityStore', () => {
  let mockTimerState: { timerRunning: boolean }
  let attentionIdleMinutes: number

  beforeEach(() => {
    vi.useFakeTimers()

    mockTimerState = reactive({ timerRunning: false })
    attentionIdleMinutes = 5

    vi.doMock('./timerState', () => ({
      useTimerStateStore: () => mockTimerState,
    }))

    vi.doMock('./userPreferences', () => ({
      useUserPreferencesStore: () => ({
        get attentionIdleMinutes() {
          return attentionIdleMinutes
        },
      }),
    }))

    // Clear module cache so mocks take effect
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function createStore() {
    const { useInactivityStore } = await import('./inactivity')
    const pinia = createPinia()
    return useInactivityStore(pinia)
  }

  describe('initial state', () => {
    it('idleSeconds starts at 0', async () => {
      const store = await createStore()
      expect(store.idleSeconds).toBe(0)
    })
  })

  describe('idle counter', () => {
    it('increments when timerRunning is false', async () => {
      const store = await createStore()
      expect(store.idleSeconds).toBe(0)

      vi.advanceTimersByTime(1000)
      expect(store.idleSeconds).toBe(1)

      vi.advanceTimersByTime(2000)
      expect(store.idleSeconds).toBe(3)
    })

    it('resets to 0 when timerRunning becomes true', async () => {
      const store = await createStore()
      vi.advanceTimersByTime(3000)
      expect(store.idleSeconds).toBe(3)

      mockTimerState.timerRunning = true
      await nextTick()
      expect(store.idleSeconds).toBe(0)
    })
  })

  describe('isActive', () => {
    it('returns true when idleSeconds exceeds threshold', async () => {
      const store = await createStore()
      expect(store.isActive).toBe(false)

      vi.advanceTimersByTime(attentionIdleMinutes * 60 * 1000)
      expect(store.isActive).toBe(true)
    })

    it('returns false when idleSeconds is below threshold', async () => {
      const store = await createStore()
      vi.advanceTimersByTime((attentionIdleMinutes * 60 - 1) * 1000)
      expect(store.isActive).toBe(false)
    })
  })
})
