import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the persist module — configs start at defaults
vi.mock('@/stores/persist', () => ({
  loadFromLocalStorage: vi.fn((_key, defaultFactory) => defaultFactory()),
  saveToLocalStorage: vi.fn(),
}))

// Pinia auto-unwraps refs, so use reactive() for plain property access
const mockStore = reactive({
  soundEnabled: true,
  perTypeSoundEnabled: { workEnd: true, breakEnd: true },
})

vi.mock('@/stores/userPreferences', () => ({
  useUserPreferencesStore: vi.fn(() => mockStore),
}))

// Re-import after mocking
const { useSound, SoundType } = await import('./sound')

describe('useSound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.soundEnabled = true
    mockStore.perTypeSoundEnabled.workEnd = true
    mockStore.perTypeSoundEnabled.breakEnd = true

    // Mock AudioContext
    window.AudioContext = class {
      currentTime = 0
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }
      }

      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        }
      }

      resume() {}
      close() {}
    } as unknown as typeof window.AudioContext
  })

  describe('playSound per-type enabled check', () => {
    it('does not create AudioContext when per-type is disabled for workEnd', () => {
      mockStore.perTypeSoundEnabled.workEnd = false
      mockStore.perTypeSoundEnabled.breakEnd = true

      const { playSound } = useSound()

      let audioContextCreated = false
      window.AudioContext = class {
        constructor() {
          audioContextCreated = true
        }

        currentTime = 0
        createOscillator() {
          return {}
        }

        createGain() {
          return {}
        }

        resume() {}
        close() {}
      } as unknown as typeof window.AudioContext

      playSound(SoundType.WorkEnd)
      expect(audioContextCreated).toBe(false)
    })

    it('does not create AudioContext when per-type is disabled for breakEnd', () => {
      mockStore.perTypeSoundEnabled.workEnd = true
      mockStore.perTypeSoundEnabled.breakEnd = false

      const { playSound } = useSound()

      let audioContextCreated = false
      window.AudioContext = class {
        constructor() {
          audioContextCreated = true
        }

        currentTime = 0
        createOscillator() {
          return {}
        }

        createGain() {
          return {}
        }

        resume() {}
        close() {}
      } as unknown as typeof window.AudioContext

      playSound(SoundType.BreakEnd)
      expect(audioContextCreated).toBe(false)
    })

    it('creates AudioContext when per-type is enabled', () => {
      mockStore.perTypeSoundEnabled.workEnd = true
      mockStore.perTypeSoundEnabled.breakEnd = true

      const { playSound } = useSound()

      let audioContextCreated = false
      window.AudioContext = class {
        constructor() {
          audioContextCreated = true
        }

        currentTime = 0
        createOscillator() {
          return {
            type: 'sine',
            frequency: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          }
        }

        createGain() {
          return {
            gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
            connect: vi.fn(),
          }
        }

        resume() {}
        close() {}
      } as unknown as typeof window.AudioContext

      playSound(SoundType.WorkEnd)
      expect(audioContextCreated).toBe(true)
    })

    it('does not create AudioContext when global soundEnabled is false', () => {
      mockStore.soundEnabled = false
      mockStore.perTypeSoundEnabled.workEnd = true
      mockStore.perTypeSoundEnabled.breakEnd = true

      const { playSound } = useSound()

      let audioContextCreated = false
      window.AudioContext = class {
        constructor() {
          audioContextCreated = true
        }

        currentTime = 0
        createOscillator() {
          return {}
        }

        createGain() {
          return {}
        }

        resume() {}
        close() {}
      } as unknown as typeof window.AudioContext

      playSound(SoundType.WorkEnd)
      expect(audioContextCreated).toBe(false)
    })
  })

  describe('soundEnabled', () => {
    it('reads from store soundEnabled', () => {
      const { soundEnabled } = useSound()
      expect(soundEnabled.value).toBe(true)
    })

    it('mutates store.soundEnabled when set', () => {
      const { soundEnabled } = useSound()
      soundEnabled.value = false
      expect(mockStore.soundEnabled).toBe(false)
    })
  })
})
