import { defineStore } from 'pinia'
import { v7 as uuid } from 'uuid'

type TimerData = {
  id: string
  duration: number
}

function getTimersFromLocalStorage () {
  const lsTimers = localStorage.getItem('taskMasterTimers')
  const defaultTimer = { id: uuid(), duration: 900 }
  const timers = lsTimers ? JSON.parse(lsTimers) as TimerData[] : [defaultTimer]
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
     * @param duration
     * @param id
     */
    addTimer(duration: number, id?: string) {
      this.timers.push({
        id: id ?? uuid(),
        duration,
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
