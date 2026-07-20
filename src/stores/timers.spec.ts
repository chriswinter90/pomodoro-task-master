import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import './test-setup'

// Mock uuid to produce predictable IDs
vi.mock('uuid', () => ({
  v7: () => 'mock-uuid-1',
}))

// Mock persist module — loadFromLocalStorage returns empty array
// so tests start clean; saveToLocalStorage is a spy
vi.mock('./persist', () => ({
  loadFromLocalStorage: vi.fn(() => []),
  saveToLocalStorage: vi.fn(),
}))

// Re-import after mocking
const { useTimersStore } = await import('./timers')
const { saveToLocalStorage } = await import('./persist')

describe('useTimersStore', () => {
  let store: ReturnType<typeof useTimersStore>

  beforeEach(() => {
    vi.clearAllMocks()
    const pinia = createPinia()
    store = useTimersStore(pinia)
  })

  describe('addTimer', () => {
    it('adds a timer with defaults for breakDuration', () => {
      store.addTimer(600)
      expect(store.timers).toHaveLength(1)
      const timer = store.timers[0]!
      expect(timer.id).toBe('mock-uuid-1')
      expect(timer.duration).toBe(600)
      expect(timer.breakDuration).toBe(300)
    })

    it('uses provided breakDuration', () => {
      store.addTimer(600, 120)
      expect(store.timers[0]!.breakDuration).toBe(120)
    })

    it('persists to localStorage', () => {
      store.addTimer(600)
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTimers', expect.any(Array))
    })

    it('throws for non-positive duration', () => {
      expect(() => store.addTimer(0)).toThrow('Timer duration must be positive')
      expect(() => store.addTimer(-100)).toThrow('Timer duration must be positive')
    })
  })

  describe('removeTimer', () => {
    it('filters out timer by id', () => {
      store.addTimer(600)
      const timerId = store.timers[0]!.id
      store.removeTimer(timerId)
      expect(store.timers).toHaveLength(0)
    })

    it('updates selectedTimer when removed timer was selected', () => {
      store.addTimer(600, 300, 'timer-1')
      store.addTimer(900, 300, 'timer-2')
      store.setSelectedTimer('timer-1')
      expect(store.selectedTimer?.id).toBe('timer-1')
      store.removeTimer('timer-1')
      expect(store.selectedTimer?.id).toBe('timer-2')
    })

    it('sets selectedTimer to null when no timers remain', () => {
      store.addTimer(600, 300, 'timer-1')
      store.setSelectedTimer('timer-1')
      store.removeTimer('timer-1')
      expect(store.selectedTimer).toBeNull()
    })

    it('persists to localStorage', () => {
      store.addTimer(600)
      store.removeTimer(store.timers[0]!.id)
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTimers', expect.any(Array))
    })
  })

  describe('setSelectedTimer', () => {
    it('selects existing timer', () => {
      store.addTimer(600, 300, 'timer-1')
      store.addTimer(900, 300, 'timer-2')
      store.setSelectedTimer('timer-2')
      expect(store.selectedTimer?.id).toBe('timer-2')
    })

    it('throws when timer not found', () => {
      expect(() => store.setSelectedTimer('nonexistent'))
        .toThrow('Timer not found: nonexistent')
    })
  })
})
