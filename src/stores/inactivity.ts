import { computed, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import { useTimerStateStore } from './timerState'
import { useUserPreferencesStore } from './userPreferences'

export const useInactivityStore = defineStore('inactivity', () => {
  const idleSeconds = ref(0)

  let intervalId: ReturnType<typeof setInterval> | null = null

  const startIdleTimer = () => {
    if (intervalId !== null) return
    intervalId = setInterval(() => {
      idleSeconds.value++
    }, 1000)
  }

  const stopIdleTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    idleSeconds.value = 0
  }

  const timerStateStore = useTimerStateStore()

  watch(
    () => timerStateStore.timerRunning,
    (running) => {
      if (running) {
        stopIdleTimer()
      } else {
        startIdleTimer()
      }
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  })

  const userPrefsStore = useUserPreferencesStore()

  const isActive = computed(() => {
    const idleMinutes = userPrefsStore.attentionIdleMinutes ?? 5
    const threshold = idleMinutes * 60
    return idleSeconds.value >= threshold
  })

  return {
    idleSeconds,
    isActive,
  }
})
