import { computed, type Ref } from 'vue'
import { useUserPreference } from '@/composables/useUserPreference'
import { loadFromLocalStorage, saveToLocalStorage } from '@/stores/persist'

export enum SoundType {
  WorkEnd = 'workEnd',
  BreakEnd = 'breakEnd',
}

export interface SoundConfig {
  frequencies: number[]
  noteDuration: number
  label: string
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
} {
  // Narrow the union Ref<string | boolean> to Ref<boolean> via a computed,
  // avoiding an unsafe `as` cast. Uses setValue to persist changes.
  const pref = useUserPreference('taskMasterSound', true)
  const soundEnabled = computed<boolean>({
    get: () => typeof pref.value.value === 'boolean' ? pref.value.value : true,
    set: (v: boolean) => {
      pref.setValue(v)
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

    const AudioContextClass = window.AudioContext
    if (!AudioContextClass) return

    const config = configs[type]
    if (!config) return

    try {
      const ctx = new AudioContextClass()
      ctx.resume()

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

      // Close the context after all notes have finished playing
      const lastNoteMs = time * 1000 + 100
      setTimeout(() => ctx.close(), lastNoteMs)
    } catch {
      // Graceful no-op if Web Audio API fails
    }
  }

  function getConfig(type: SoundType): SoundConfig {
    return configs[type] ?? defaultConfigs[type]
  }

  function setConfig(type: SoundType, config: SoundConfig): void {
    configs[type] = { ...config, frequencies: [...config.frequencies] }
    saveToLocalStorage(STORAGE_KEY, configs)
  }

  return { playSound, getConfig, setConfig, soundEnabled }
}
