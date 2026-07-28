import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'


describe('useTimerStateStore', () => {
  async function createStore() {
    const { useTimerStateStore } = await import('./timerState')
    const pinia = createPinia()
    return useTimerStateStore(pinia)
  }

  describe('initial state', () => {
    it('defaults to { mode: "idle", timerRunning: false }', async () => {
      const store = await createStore()
      expect(store.mode).toBe('idle')
      expect(store.timerRunning).toBe(false)
    })
  })

  describe('mode', () => {
    it('can be set to "idle"', async () => {
      const store = await createStore()
      store.mode = 'idle'
      expect(store.mode).toBe('idle')
    })

    it('can be set to "work"', async () => {
      const store = await createStore()
      store.mode = 'work'
      expect(store.mode).toBe('work')
    })

    it('can be set to "countdown"', async () => {
      const store = await createStore()
      store.mode = 'countdown'
      expect(store.mode).toBe('countdown')
    })

    it('can be set to "break"', async () => {
      const store = await createStore()
      store.mode = 'break'
      expect(store.mode).toBe('break')
    })
  })

  describe('timerRunning', () => {
    it('can be toggled to true', async () => {
      const store = await createStore()
      store.timerRunning = true
      expect(store.timerRunning).toBe(true)
    })

    it('can be toggled to false', async () => {
      const store = await createStore()
      store.timerRunning = true
      store.timerRunning = false
      expect(store.timerRunning).toBe(false)
    })
  })
})
