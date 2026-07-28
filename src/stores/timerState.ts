import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TimerStatus } from '@/components/composables/timerController'

export const useTimerStateStore = defineStore('timerState', () => {
  const mode = ref<TimerStatus>('idle')
  const timerRunning = ref<boolean>(false)

  return {
    mode,
    timerRunning,
  }
})
