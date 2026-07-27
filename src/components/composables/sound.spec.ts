import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the persist module — configs start at defaults
vi.mock('@/stores/persist', () => ({
  loadFromLocalStorage: vi.fn((_key, defaultFactory) => defaultFactory()),
  saveToLocalStorage: vi.fn(),
}))

// Create a mutable store mock
const mockSetSoundEnabled = vi.fn()
const mockStoreState = {
  soundEnabled: true,
  perTypeSoundEnabled: { workEnd: true, breakEnd: true },
  setSoundEnabled: mockSetSoundEnabled,
}

vi.mock('@/stores/userPreferences', () => ({
  useUserPreferencesStore: vi.fn(() => mockStoreState),
}))

// Re-import after mocking
const { useSound, SoundType } = await import('./sound')

describe('useSound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetSoundEnabled.mockClear()
    mockStoreState.soundEnabled = true
    mockStoreState.perTypeSoundEnabled = { workEnd: true, breakEnd: true }

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
      // Disable workEnd in the mocked store
      mockStoreState.perTypeSoundEnabled = { workEnd: false, breakEnd: true }

      const { playSound } = useSound()

      let audioContextCreated = false
      window.AudioContext = class {
        constructor() {
          audioContextCreated = true
        }
        currentTime = 0
        createOscillator() { return {} }
        createGain() { return {} }
        resume() {}
        close() {}
      } as unknown as typeof window.AudioContext

      playSound(SoundType.WorkEnd)
      expect(audioContextCreated).toBe(false)
    })

    it('does not create AudioContext when per-type is disabled for breakEnd', () => {
      mockStoreState.perTypeSoundEnabled = { workEnd: true, breakEnd: false }

      const { playSound } = useSound()

      let audioContextCreated = false
      window.AudioContext = class {
        constructor() {
          audioContextCreated = true
        }
        currentTime = 0
        createOscillator() { return {} }
        createGain() { return {} }
        resume() {}
        close() {}
      } as unknown as typeof window.AudioContext

      playSound(SoundType.BreakEnd)
      expect(audioContextCreated).toBe(false)
    })

    it('creates AudioContext when per-type is enabled', () => {
      mockStoreState.perTypeSoundEnabled = { workEnd: true, breakEnd: true }

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
      mockStoreState.soundEnabled = false
      mockStoreState.perTypeSoundEnabled = { workEnd: true, breakEnd: true }

      const { playSound } = useSound()

      let audioContextCreated = false
      window.AudioContext = class {
        constructor() {
          audioContextCreated = true
        }
        currentTime = 0
        createOscillator() { return {} }
        createGain() { return {} }
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

    it('calls setSoundEnabled when set', () => {
      const { soundEnabled } = useSound()
      soundEnabled.value = false
      expect(mockSetSoundEnabled).toHaveBeenCalledWith(false)
    })
  })
})
