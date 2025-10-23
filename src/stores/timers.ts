import { defineStore } from 'pinia'
import { v7 as uuid } from 'uuid'

type TimerData = {
  id: string
  duration: number
}

export const useTimersStore = defineStore('timers', {
  state: () => ({
    selectedTimer: null as TimerData | null,
    timers: [{ id: uuid(), duration: 300 }] as TimerData[],
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
    },
    removeTimer(id: string) {
      this.timers = this.timers.filter(timer => timer.id !== id)
    },
    setSelectedTimer(id: string | null) {
      if (id === null) this.selectedTimer = null
      this.selectedTimer = this.timers.find(timer => timer.id === id) || null
    },
  },
})
