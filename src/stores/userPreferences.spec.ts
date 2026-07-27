import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import './test-setup'

// Mock persist module — loadFromLocalStorage returns default values
// so tests start with clean defaults; saveToLocalStorage is a spy
vi.mock('./persist', () => ({
  loadFromLocalStorage: vi.fn((key, defaultFactory) => defaultFactory()),
  saveToLocalStorage: vi.fn(),
}))

// Re-import after mocking
const { useUserPreferencesStore } = await import('./userPreferences')
const { saveToLocalStorage, loadFromLocalStorage } = await import('./persist')

describe('useUserPreferencesStore', () => {
  let store: ReturnType<typeof useUserPreferencesStore>

  beforeEach(() => {
    vi.clearAllMocks()
    const pinia = createPinia()
    store = useUserPreferencesStore(pinia)
  })

  describe('state shape', () => {
    it('has theme as a string', () => {
      expect(typeof store.theme).toBe('string')
    })

    it('has listView as a string', () => {
      expect(typeof store.listView).toBe('string')
    })

    it('has soundEnabled as a boolean', () => {
      expect(typeof store.soundEnabled).toBe('boolean')
    })

    it('has perTypeSoundEnabled as an object', () => {
      expect(typeof store.perTypeSoundEnabled).toBe('object')
      expect(store.perTypeSoundEnabled).not.toBeNull()
    })
  })

  describe('default values', () => {
    it('defaults theme to "system"', () => {
      expect(store.theme).toBe('system')
    })

    it('defaults listView to "kanban"', () => {
      expect(store.listView).toBe('kanban')
    })

    it('defaults soundEnabled to true', () => {
      expect(store.soundEnabled).toBe(true)
    })

    it('defaults perTypeSoundEnabled to { workEnd: true, breakEnd: true }', () => {
      expect(store.perTypeSoundEnabled).toEqual({ workEnd: true, breakEnd: true })
    })
  })

  describe('load from localStorage', () => {
    function mockLoad(keys: Record<string, unknown>) {
      // Queue one implementation per state field (4 calls to loadFromLocalStorage)
      const override = (key: string, _df: () => unknown) =>
        keys[key] ?? (_df as () => unknown)()
      for (let i = 0; i < 4; i++) {
        vi.mocked(loadFromLocalStorage).mockImplementationOnce(override)
      }
    }

    it('loads theme from taskMasterTheme', async () => {
      mockLoad({ taskMasterTheme: 'dark' })
      const { useUserPreferencesStore } = await import('./userPreferences')
      const pinia = createPinia()
      const loaded = useUserPreferencesStore(pinia)
      expect(loaded.theme).toBe('dark')
    })

    it('loads listView from taskMasterDefaultView', async () => {
      mockLoad({ taskMasterDefaultView: 'list' })
      const { useUserPreferencesStore } = await import('./userPreferences')
      const pinia = createPinia()
      const loaded = useUserPreferencesStore(pinia)
      expect(loaded.listView).toBe('list')
    })

    it('loads soundEnabled from taskMasterSound', async () => {
      mockLoad({ taskMasterSound: false })
      const { useUserPreferencesStore } = await import('./userPreferences')
      const pinia = createPinia()
      const loaded = useUserPreferencesStore(pinia)
      expect(loaded.soundEnabled).toBe(false)
    })

    it('loads perTypeSoundEnabled from taskMasterSoundPerType', async () => {
      mockLoad({ taskMasterSoundPerType: { workEnd: false, breakEnd: true } })
      const { useUserPreferencesStore } = await import('./userPreferences')
      const pinia = createPinia()
      const loaded = useUserPreferencesStore(pinia)
      expect(loaded.perTypeSoundEnabled).toEqual({ workEnd: false, breakEnd: true })
    })
  })

  describe('setTheme', () => {
    it('updates theme state', () => {
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
    })

    it('persists to taskMasterTheme', () => {
      store.setTheme('light')
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTheme', 'light')
    })
  })

  describe('setListView', () => {
    it('updates listView state', () => {
      store.setListView('list')
      expect(store.listView).toBe('list')
    })

    it('persists to taskMasterDefaultView', () => {
      store.setListView('list')
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterDefaultView', 'list')
    })
  })

  describe('setSoundEnabled', () => {
    it('updates soundEnabled state', () => {
      store.setSoundEnabled(false)
      expect(store.soundEnabled).toBe(false)
    })

    it('persists to taskMasterSound', () => {
      store.setSoundEnabled(false)
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterSound', false)
    })
  })

  describe('setPerTypeSoundEnabled', () => {
    it('updates perTypeSoundEnabled for the given type', () => {
      store.setPerTypeSoundEnabled('workEnd', false)
      expect(store.perTypeSoundEnabled.workEnd).toBe(false)
      expect(store.perTypeSoundEnabled.breakEnd).toBe(true)
    })

    it('persists to taskMasterSoundPerType', () => {
      store.setPerTypeSoundEnabled('breakEnd', false)
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterSoundPerType', {
        workEnd: true,
        breakEnd: false,
      })
    })

    it('throws on unknown type key', () => {
      expect(() => store.setPerTypeSoundEnabled('unknown' as any, true)).toThrow(
        'Invalid sound type: unknown',
      )
    })
  })

  describe('input validation', () => {
    it('throws on invalid theme value', () => {
      expect(() => store.setTheme('invalid' as any)).toThrow('Invalid theme: invalid')
    })

    it('throws on invalid list view value', () => {
      expect(() => store.setListView('invalid' as any)).toThrow('Invalid list view: invalid')
    })
  })
})
