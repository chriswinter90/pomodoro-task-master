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

const _useUserPreferencesStore = defineStore('userPreferences', {
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
})

/** Mapping of state property names to their localStorage keys. */
const PERSIST_KEYS: Record<string, string> = {
  theme: 'taskMasterTheme',
  listView: 'taskMasterDefaultView',
  soundEnabled: 'taskMasterSound',
  perTypeSoundEnabled: 'taskMasterSoundPerType',
}

// Track which store instances already have the subscription set up
const _subscribedStores = new WeakSet<any>()

export const useUserPreferencesStore = ((pinia?: any) => {
  const store = _useUserPreferencesStore(pinia)
  if (!_subscribedStores.has(store)) {
    _subscribedStores.add(store)

    // Snapshot initial state so the first real change has a baseline to compare against.
    // Vue skips same-value assignments, so a "prime" mutation won't work.
    let previousState: Record<string, unknown> = JSON.parse(
      JSON.stringify(store.$state),
    )

    store.$subscribe((_mutation, state) => {
      const currentState = state as Record<string, unknown>

      for (const [prop, key] of Object.entries(PERSIST_KEYS)) {
        const newValue = currentState[prop]
        const oldValue = previousState[prop]

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          saveToLocalStorage(key, newValue)
        }
      }

      previousState = JSON.parse(JSON.stringify(currentState))
    }, { flush: 'sync' })
  }
  return store
}) as typeof _useUserPreferencesStore
