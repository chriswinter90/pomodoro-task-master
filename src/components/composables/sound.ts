import { computed, ref, type Ref } from 'vue'
import { loadFromLocalStorage, saveToLocalStorage } from '@/stores/persist'
import { useUserPreferencesStore } from '@/stores/userPreferences'

export enum SoundType {
  WorkEnd = 'workEnd',
  BreakEnd = 'breakEnd',
}

export interface SoundConfig {
  frequencies: number[]
  noteDuration: number
  label: string
}

export interface SoundPlaybackHandle {
  stop: () => void
  isPlaying: Ref<boolean>
}

const defaultConfigs: Record<SoundType, SoundConfig> = {
  [SoundType.WorkEnd]: {
    frequencies: [523.25, 659.25, 783.99],
    noteDuration: 150,
    label: 'Work End',
  },
  [SoundType.BreakEnd]: {
    frequencies: [392, 329.63, 261.63],
    noteDuration: 200,
    label: 'Break End',
  },
}

const STORAGE_KEY = 'taskMasterSoundConfigs'

export function useSound(): {
  playSound: (type: SoundType) => void
  getConfig: (type: SoundType) => SoundConfig
  setConfig: (type: SoundType, config: SoundConfig) => void
  soundEnabled: Ref<boolean>
  playConfig: (config: SoundConfig) => SoundPlaybackHandle
} {
  const store = useUserPreferencesStore()
  const soundEnabled = computed<boolean>({
    get: () => store.soundEnabled,
    set: (v: boolean) => {
      store.soundEnabled = v
    },
  })

  const configs = loadFromLocalStorage<Record<SoundType, SoundConfig>>(
    STORAGE_KEY,
    () => ({ ...defaultConfigs }),
    raw => {
      if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
        const typed = raw as Record<string, unknown>
        const result: Record<SoundType, SoundConfig> = {
          [SoundType.WorkEnd]: defaultConfigs[SoundType.WorkEnd],
          [SoundType.BreakEnd]: defaultConfigs[SoundType.BreakEnd],
        }
        for (const type of Object.values(SoundType)) {
          const entry = typed[type]
          if (
            typeof entry === 'object'
            && entry !== null
            && 'frequencies' in entry
            && 'noteDuration' in entry
            && 'label' in entry
          ) {
            const cfg = entry as Record<string, unknown>
            if (
              Array.isArray(cfg.frequencies)
              && typeof cfg.noteDuration === 'number'
              && typeof cfg.label === 'string'
            ) {
              result[type] = entry as SoundConfig
            }
          }
        }
        return result
      }
      return { ...defaultConfigs }
    },
  )

  function playSound(type: SoundType) {
    if (!soundEnabled.value) return

    // Check per-type enabled — skip if this specific sound type is disabled
    const typeKey = type as 'workEnd' | 'breakEnd'
    if (!store.perTypeSoundEnabled[typeKey]) return

    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return

    const config = configs[type]
    if (!config) return

    try {
      const ctx = new AudioContextClass()
      ctx.resume()

      const endTime = playTone(config, ctx)

      // Close the context after all notes have finished playing
      const lastNoteMs = endTime * 1000 + 100
      setTimeout(() => ctx.close(), lastNoteMs)
    } catch {
      // Graceful no-op if Web Audio API fails
    }
  }

  // Schedules all notes from config on the given AudioContext.
  // Returns the scheduled end time in seconds (AudioContext timeline).
  function playTone(config: SoundConfig, ctx: AudioContext): number {
    let time = ctx.currentTime

    for (const freq of config.frequencies) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)

      gain.gain.setValueAtTime(0.3, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + config.noteDuration / 1000)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(time)
      osc.stop(time + config.noteDuration / 1000)

      time += config.noteDuration / 1000
    }

    return time
  }

  function playConfig(config: SoundConfig): SoundPlaybackHandle {
    // Clamp frequencies to audible range
    const clampedFrequencies = config.frequencies.map(f => Math.max(20, Math.min(20000, f)))
    const clampedConfig: SoundConfig = {
      ...config,
      frequencies: clampedFrequencies,
    }

    // Handle empty frequency array
    if (clampedConfig.frequencies.length === 0) {
      return {
        stop: () => {},
        isPlaying: ref(false),
      }
    }

    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) {
      return {
        stop: () => {},
        isPlaying: ref(false),
      }
    }

    const isPlaying = ref(true)
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    try {
      const ctx = new AudioContextClass()
      ctx.resume()

      const endTime = playTone(clampedConfig, ctx)

      // Schedule auto-close after all notes finish
      const lastNoteMs = endTime * 1000 + 100
      timeoutId = setTimeout(() => {
        ctx.close()
        isPlaying.value = false
      }, lastNoteMs)

      return {
        stop: () => {
          if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          ctx.close()
          isPlaying.value = false
        },
        isPlaying,
      }
    } catch {
      return {
        stop: () => {},
        isPlaying: ref(false),
      }
    }
  }

  function getConfig(type: SoundType): SoundConfig {
    return configs[type] ?? defaultConfigs[type]
  }

  function setConfig(type: SoundType, config: SoundConfig): void {
    configs[type] = { ...config, frequencies: [...config.frequencies] }
    saveToLocalStorage(STORAGE_KEY, configs)
  }

  return { playSound, getConfig, setConfig, soundEnabled, playConfig }
}
