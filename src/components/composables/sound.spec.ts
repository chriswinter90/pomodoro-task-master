import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type SoundConfig, SoundType, useSound } from './sound'

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

function createMockAudioContext() {
  const calls: {
    createOscillator: { freq: number }[]
    createGain: number
    resume: number
  } = {
    createOscillator: [],
    createGain: 0,
    resume: 0,
  }

  const MockAudioContext = vi.fn(function () {
    return {
      createOscillator () {
        calls.createOscillator.push({ freq: 0 })
        return {
          type: 'sine',
          frequency: {
            setValueAtTime (freq: number) {
              calls.createOscillator[calls.createOscillator.length - 1]!.freq = freq
            },
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }
      },
      createGain () {
        calls.createGain++
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        }
      },
      destination: {},
      resume () {
        calls.resume++
      },
      currentTime: 0,
    }
  })

  return { MockAudioContext, calls }
}

describe('useSound', () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
    vi.restoreAllMocks()
  })

  it('playSound is no-op when soundEnabled is false', () => {
    // Pre-set localStorage so soundEnabled is false
    mockStorage['taskMasterSound'] = JSON.stringify(false)

    const { MockAudioContext } = createMockAudioContext()
    ;(globalThis as any).AudioContext = MockAudioContext

    const { playSound } = useSound()
    playSound(SoundType.WorkEnd)

    // AudioContext should never be instantiated
    expect(MockAudioContext).not.toHaveBeenCalled()
  })

  it('playSound creates oscillator nodes for each frequency in config', () => {
    const { MockAudioContext, calls } = createMockAudioContext()
    ;(globalThis as any).AudioContext = MockAudioContext

    const { playSound } = useSound()
    playSound(SoundType.WorkEnd)

    // Should create one oscillator per frequency (3 for work-end)
    expect(calls.createOscillator).toHaveLength(3)
    expect(calls.createOscillator[0]!.freq).toBe(523.25)
    expect(calls.createOscillator[1]!.freq).toBe(659.25)
    expect(calls.createOscillator[2]!.freq).toBe(783.99)
  })

  it('playSound is no-op when window.AudioContext is undefined', () => {
    delete (globalThis as any).AudioContext

    const { playSound } = useSound()
    expect(() => playSound(SoundType.WorkEnd)).not.toThrow()
  })

  it('getConfig returns correct default config', () => {
    const { getConfig } = useSound()

    const workConfig = getConfig(SoundType.WorkEnd)
    expect(workConfig.frequencies).toEqual([523.25, 659.25, 783.99])
    expect(workConfig.noteDuration).toBe(150)
    expect(workConfig.label).toBe('Work End')

    const breakConfig = getConfig(SoundType.BreakEnd)
    expect(breakConfig.frequencies).toEqual([392, 329.63, 261.63])
    expect(breakConfig.noteDuration).toBe(200)
    expect(breakConfig.label).toBe('Break End')
  })

  it('setConfig persists to localStorage and returns updated config', () => {
    const { setConfig, getConfig } = useSound()

    const newConfig: SoundConfig = {
      frequencies: [440, 880],
      noteDuration: 100,
      label: 'Custom',
    }
    setConfig(SoundType.WorkEnd, newConfig)

    // Verify localStorage was written
    expect(mockStorage['taskMasterSoundConfigs']).toBeDefined()
    const saved = JSON.parse(mockStorage['taskMasterSoundConfigs']!)
    expect(saved[SoundType.WorkEnd]!.frequencies).toEqual([440, 880])
    expect(saved[SoundType.WorkEnd]!.noteDuration).toBe(100)
    expect(saved[SoundType.WorkEnd]!.label).toBe('Custom')

    // Verify getConfig returns the updated value
    const retrieved = getConfig(SoundType.WorkEnd)
    expect(retrieved.frequencies).toEqual([440, 880])
    expect(retrieved.noteDuration).toBe(100)
    expect(retrieved.label).toBe('Custom')
  })

  it('configs load from localStorage on initialization', () => {
    const customConfigs = {
      [SoundType.WorkEnd]: {
        frequencies: [100, 200],
        noteDuration: 50,
        label: 'Loaded',
      },
      [SoundType.BreakEnd]: {
        frequencies: [300, 400, 500],
        noteDuration: 75,
        label: 'Loaded Break',
      },
    }
    mockStorage['taskMasterSoundConfigs'] = JSON.stringify(customConfigs)

    const { getConfig } = useSound()

    expect(getConfig(SoundType.WorkEnd).frequencies).toEqual([100, 200])
    expect(getConfig(SoundType.WorkEnd).noteDuration).toBe(50)
    expect(getConfig(SoundType.WorkEnd).label).toBe('Loaded')
    expect(getConfig(SoundType.BreakEnd).frequencies).toEqual([300, 400, 500])
    expect(getConfig(SoundType.BreakEnd).noteDuration).toBe(75)
    expect(getConfig(SoundType.BreakEnd).label).toBe('Loaded Break')
  })
})
