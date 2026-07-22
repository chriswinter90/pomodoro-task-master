import { defineStore } from 'pinia'
import { v7 as uuid } from 'uuid'

import { loadFromLocalStorage, saveToLocalStorage } from './persist'

/**
 * Represents a pomodoro timer preset.
 */
export type TimerData = {
  /** Unique identifier */
  id: string
  /** Work duration in seconds */
  duration: number
  /** Break duration in seconds (optional, defaults to 300) */
  breakDuration?: number
}

function defaultTimer(): TimerData {
  return { id: uuid(), duration: 900, breakDuration: 300 }
}

function reviveTimers(raw: unknown): TimerData[] {
  const obj = raw as { id: string, duration: number, breakDuration?: number }[]
  if (!Array.isArray(obj)) return [defaultTimer()]
  // Migrate: ensure every timer has breakDuration
  const timers: TimerData[] = obj.map(t => ({
    id: t.id,
    duration: t.duration,
    breakDuration: t.breakDuration ?? 300,
  }))
  return timers.length > 0 ? timers : [defaultTimer()]
}

const initTimers = loadFromLocalStorage('taskMasterTimers', () => [defaultTimer()], reviveTimers)

export const useTimersStore = defineStore('timers', {
  state: () => ({
    timers: [...initTimers],
    selectedTimer: initTimers[0] ?? null,
  }),
  actions: {
    /**
     * Add a timer to the store.
     * @param duration - Work duration in seconds
     * @param breakDuration - Break duration in seconds (default 300)
     * @param id - Optional timer ID (auto-generated UUID v7 if omitted)
     */
    addTimer(duration: number, breakDuration?: number, id?: string) {
      if (duration <= 0) {
        throw new Error(`Timer duration must be positive, got ${duration}`)
      }
      this.timers.push({
        id: id ?? uuid(),
        duration,
        breakDuration: breakDuration ?? 300,
      })
      saveToLocalStorage('taskMasterTimers', this.timers)
    },

    /**
     * Remove a timer by its ID.
     * If the removed timer was the selected one, selects the first remaining timer or null.
     * @param id - The timer's unique identifier
     */
    removeTimer(id: string) {
      const wasSelected = this.selectedTimer?.id === id
      this.timers = this.timers.filter(timer => timer.id !== id)
      if (wasSelected) {
        this.selectedTimer = this.timers[0] ?? null
      }
      saveToLocalStorage('taskMasterTimers', this.timers)
    },

    /**
     * Select a timer by its ID.
     * @param id - The timer's unique identifier
     * @throws Error if no timer with the given ID exists
     */
    setSelectedTimer(id: string) {
      const timer = this.timers.find(timer => timer.id === id)
      if (!timer) {
        throw new Error(`Timer not found: ${id}`)
      }
      this.selectedTimer = timer
    },
  },
})
