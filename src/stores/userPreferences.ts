import { defineStore } from 'pinia'

import { loadFromLocalStorage, saveToLocalStorage } from './persist'

/**
 * Sound event types that can be toggled individually.
 */
export type SoundTypeStr = 'workEnd' | 'breakEnd'

/**
 * Application theme values.
 */
export type ThemeValue = 'system' | 'light' | 'dark'

/**
 * List view layout values.
 */
export type ListViewValue = 'list' | 'kanban'

/**
 * Full user preferences state shape.
 */
export interface UserPreferencesState {
  theme: ThemeValue
  listView: ListViewValue
  soundEnabled: boolean
  perTypeSoundEnabled: Record<SoundTypeStr, boolean>
}

export const useUserPreferencesStore = defineStore('userPreferences', {
  state: (): UserPreferencesState => ({
    theme: loadFromLocalStorage<ThemeValue>('taskMasterTheme', () => 'system'),
    listView: loadFromLocalStorage<ListViewValue>('taskMasterDefaultView', () => 'kanban'),
    soundEnabled: loadFromLocalStorage<boolean>('taskMasterSound', () => true),
    perTypeSoundEnabled: loadFromLocalStorage<Record<SoundTypeStr, boolean>>(
      'taskMasterSoundPerType',
      () => ({ workEnd: true, breakEnd: true }),
      raw => {
        if (typeof raw !== 'object' || raw === null) return { workEnd: true, breakEnd: true }
        const r = raw as Record<string, unknown>
        return {
          workEnd: r.workEnd === true,
          breakEnd: r.breakEnd === true,
        }
      },
    ),
  }),
  actions: {
    /**
     * Set the application theme and persist to localStorage.
     * @param value - The new theme value
     */
    setTheme(value: ThemeValue): void {
      const validThemes: ThemeValue[] = ['system', 'light', 'dark']
      if (!validThemes.includes(value)) {
        throw new Error(`Invalid theme: ${value}`)
      }
      this.theme = value
      saveToLocalStorage('taskMasterTheme', value)
    },

    /**
     * Set the default list view layout and persist to localStorage.
     * @param value - The new list view value
     */
    setListView(value: ListViewValue): void {
      const validViews: ListViewValue[] = ['list', 'kanban']
      if (!validViews.includes(value)) {
        throw new Error(`Invalid list view: ${value}`)
      }
      this.listView = value
      saveToLocalStorage('taskMasterDefaultView', value)
    },

    /**
     * Enable or disable all sounds and persist to localStorage.
     * @param value - Whether sounds are enabled globally
     */
    setSoundEnabled(value: boolean): void {
      this.soundEnabled = value
      saveToLocalStorage('taskMasterSound', value)
    },

    /**
     * Enable or disable sound for a specific event type and persist to localStorage.
     * @param type - The sound event type
     * @param value - Whether sound is enabled for this type
     */
    setPerTypeSoundEnabled(type: SoundTypeStr, value: boolean): void {
      if (type !== 'workEnd' && type !== 'breakEnd') {
        throw new Error(`Invalid sound type: ${type}`)
      }
      this.perTypeSoundEnabled[type] = value
      saveToLocalStorage('taskMasterSoundPerType', { ...this.perTypeSoundEnabled })
    },
  },
})
