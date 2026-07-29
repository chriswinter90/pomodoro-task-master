import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import './test-setup'

// Partial mock: keep loadFromLocalStorage real, replace saveToLocalStorage with a spy
vi.mock('./persist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./persist')>()
  return {
    ...actual,
    saveToLocalStorage: vi.fn(),
  }
})

const { saveToLocalStorage } = await import('./persist')

describe('useUserPreferencesStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function createStore() {
    const { useUserPreferencesStore } = await import('./userPreferences')
    const pinia = createPinia()
    return useUserPreferencesStore(pinia)
  }

  describe('state shape', () => {
    it('has theme as a string', async () => {
      const store = await createStore()
      expect(typeof store.theme).toBe('string')
    })

    it('has listView as a string', async () => {
      const store = await createStore()
      expect(typeof store.listView).toBe('string')
    })

    it('has soundEnabled as a boolean', async () => {
      const store = await createStore()
      expect(typeof store.soundEnabled).toBe('boolean')
    })

    it('has perTypeSoundEnabled as an object', async () => {
      const store = await createStore()
      expect(typeof store.perTypeSoundEnabled).toBe('object')
      expect(store.perTypeSoundEnabled).not.toBeNull()
    })

    it('has attentionEnabled as a boolean', async () => {
      const store = await createStore()
      expect(typeof store.attentionEnabled).toBe('boolean')
    })

    it('has attentionIdleMinutes as a number', async () => {
      const store = await createStore()
      expect(typeof store.attentionIdleMinutes).toBe('number')
    })

    it('has attentionEffectVariant as a string', async () => {
      const store = await createStore()
      expect(typeof store.attentionEffectVariant).toBe('string')
    })
  })

  describe('default values', () => {
    it('defaults theme to "system"', async () => {
      const store = await createStore()
      expect(store.theme).toBe('system')
    })

    it('defaults listView to "kanban"', async () => {
      const store = await createStore()
      expect(store.listView).toBe('kanban')
    })

    it('defaults soundEnabled to true', async () => {
      const store = await createStore()
      expect(store.soundEnabled).toBe(true)
    })

    it('defaults perTypeSoundEnabled to { workEnd: true, breakEnd: true }', async () => {
      const store = await createStore()
      expect(store.perTypeSoundEnabled).toEqual({ workEnd: true, breakEnd: true })
    })

    it('defaults attentionEnabled to true', async () => {
      const store = await createStore()
      expect(store.attentionEnabled).toBe(true)
    })

    it('defaults attentionIdleMinutes to 5', async () => {
      const store = await createStore()
      expect(store.attentionIdleMinutes).toBe(5)
    })

    it('defaults attentionEffectVariant to "rainbow"', async () => {
      const store = await createStore()
      expect(store.attentionEffectVariant).toBe('rainbow')
    })
  })

  describe('direct mutation persistence', () => {
    it('persists theme change to taskMasterTheme', async () => {
      const s = await createStore()
      s.theme = 'dark'
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTheme', 'dark')
    })

    it('persists listView change to taskMasterDefaultView', async () => {
      const s = await createStore()
      s.listView = 'list'
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterDefaultView', 'list')
    })

    it('persists soundEnabled change to taskMasterSound', async () => {
      const s = await createStore()
      s.soundEnabled = false
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterSound', false)
    })

    it('persists perTypeSoundEnabled change to taskMasterSoundPerType', async () => {
      const s = await createStore()
      s.perTypeSoundEnabled.workEnd = false
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterSoundPerType', expect.objectContaining({ workEnd: false }))
    })

    it('does not persist unchanged props', async () => {
      const s = await createStore()
      s.theme = 'dark'
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterTheme', 'dark')
      expect(saveToLocalStorage).toHaveBeenCalledTimes(1)
    })

    it('does not save when value is unchanged', async () => {
      const s = await createStore()
      s.theme = 'system' // same as current value
      expect(saveToLocalStorage).not.toHaveBeenCalled()
    })

    it('persists attentionEnabled change', async () => {
      const s = await createStore()
      s.attentionEnabled = false
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterAttentionEnabled', false)
    })

    it('persists attentionIdleMinutes change', async () => {
      const s = await createStore()
      s.attentionIdleMinutes = 10
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterAttentionIdleMinutes', 10)
    })

    it('persists attentionEffectVariant change', async () => {
      const s = await createStore()
      s.attentionEffectVariant = 'none'
      expect(saveToLocalStorage).toHaveBeenCalledWith('taskMasterAttentionEffectVariant', 'none')
    })
  })
})
