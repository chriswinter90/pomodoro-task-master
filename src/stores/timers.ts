import { defineStore } from 'pinia'
import { v7 as uuid } from 'uuid'

export type TimerData = {
  id: string
  duration: number
  breakDuration?: number
}

function getTimersFromLocalStorage () {
  const lsTimers = localStorage.getItem('taskMasterTimers')
  const defaultTimer: TimerData = { id: uuid(), duration: 900, breakDuration: 300 }
  const rawTimers = lsTimers ? JSON.parse(lsTimers) : [defaultTimer]
  // Migrate: ensure every timer has breakDuration
  const timers: TimerData[] = rawTimers.map((t: TimerData) => ({
    ...t,
    breakDuration: t.breakDuration ?? 300,
  }))
  return timers.length > 0 ? timers : [defaultTimer]
}

function saveTimersToLocalStorage (timers: TimerData[]) {
  localStorage.setItem('taskMasterTimers', JSON.stringify(timers))
}

const initTimers = getTimersFromLocalStorage()

export const useTimersStore = defineStore('timers', {
  state: () => ({
    timers: initTimers as TimerData[],
    selectedTimer: initTimers[0]!,
  }),
  actions: {
    /**
     * Add a timer to the store.
     * @param duration - work duration in seconds
     * @param breakDuration - break duration in seconds (default 300)
     * @param id - optional timer id
     */
    addTimer(duration: number, breakDuration?: number, id?: string) {
      this.timers.push({
        id: id ?? uuid(),
        duration,
        breakDuration: breakDuration ?? 300,
      })
      saveTimersToLocalStorage(this.timers)
    },
    removeTimer(id: string) {
      this.timers = this.timers.filter(timer => timer.id !== id)
      saveTimersToLocalStorage(this.timers)
    },
    setSelectedTimer(id: string) {
      this.selectedTimer = this.timers.find(timer => timer.id === id)!
    },
  },
})
