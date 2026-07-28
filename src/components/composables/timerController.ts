import { computed, type ComputedRef, ref, watch } from 'vue'
import { displayTime, useTimer } from '@/components/composables/timer.ts'
import { SoundType, useSound } from '@/components/composables/sound.ts'
import type { TimerData } from '@/stores/timers.ts'
import { useTimerStateStore } from '@/stores/timerState'

export type TimerStatus = 'idle' | 'work' | 'countdown' | 'break'

const COUNTDOWN_DURATION = 30 // seconds

export function useTimerController(timerData: TimerData) {
  const workTimerDuration = timerData.duration
  const breakTimerDuration = timerData.breakDuration ?? 300

  const mode = ref<TimerStatus>('idle')
  const countdownRemaining = ref(0)

  // Sound playback
  const { playSound } = useSound()

  // Work timer instance
  const workTimer = useTimer(workTimerDuration)
  // Break timer instance
  const breakTimer = useTimer(breakTimerDuration)

  // Countdown interval
  let countdownInterval: number | null = null

  // Track whether we've already handled completion for the current timer run
  let workCompleted = false
  let breakCompleted = false

  // Watchers for timer completion
  let workCompletionUnwatch: (() => void) | null = null
  let breakCompletionUnwatch: (() => void) | null = null

  const displayTimeString: ComputedRef<string> = computed(() => {
    if (mode.value === 'countdown') {
      return displayTime(countdownRemaining.value)
    }
    if (mode.value === 'break') {
      return breakTimer.displayTimeString.value
    }
    return workTimer.displayTimeString.value
  })

  const timerRunning: ComputedRef<boolean> = computed(() => {
    if (mode.value === 'work') return workTimer.timerRunning.value
    if (mode.value === 'break') return breakTimer.timerRunning.value
    return false
  })

  // Sync local state into the timerState Pinia store
  const store = useTimerStateStore()
  watch(mode, (val) => {
    store.mode = val
  })
  watch(timerRunning, (val) => {
    store.timerRunning = val
  })

  function requestNotificationPermission(): Promise<'default' | 'denied' | 'granted'> {
    if (Notification.permission !== 'default') {
      return Promise.resolve(Notification.permission)
    }
    return Notification.requestPermission()
  }

  function sendNotification(title: string, body: string) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body })
        console.log('Notification sent:', title)
      } else if (Notification.permission === 'denied') {
        console.warn('Notification permission denied')
      } else {
        requestNotificationPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(title, { body })
            console.log('Notification sent (after permission):', title)
          }
        }).catch(() => { /* permission denied or unavailable */ })
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  function startCountdown() {
    countdownRemaining.value = COUNTDOWN_DURATION
    mode.value = 'countdown'

    countdownInterval = window.setInterval(() => {
      countdownRemaining.value--
      if (countdownRemaining.value <= 0) {
        stopCountdown()
        // Auto-transition to break
        startBreak()
      }
    }, 1000)
  }

  function stopCountdown() {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }

  function startBreak() {
    breakCompleted = false
    breakTimer.setDuration(breakTimerDuration)
    breakTimer.resetTimer()
    breakTimer.startTimer()
    mode.value = 'break'
  }

  function start() {
    requestNotificationPermission().catch(() => { /* permission denied or unavailable */ })
    stopCountdown()

    // Reset completion flags
    workCompleted = false

    // Reset both timers
    workTimer.setDuration(workTimerDuration)
    workTimer.resetTimer()
    breakTimer.resetTimer()

    workTimer.startTimer()
    mode.value = 'work'
  }

  function stop() {
    stopCountdown()
    countdownRemaining.value = 0
    if (mode.value === 'work') {
      workTimer.stopTimer()
    } else if (mode.value === 'break') {
      breakTimer.stopTimer()
    }
    mode.value = 'idle'
  }

  function reset() {
    stopCountdown()
    workTimer.stopTimer()
    workTimer.resetTimer()
    breakTimer.stopTimer()
    breakTimer.resetTimer()
    mode.value = 'idle'
    countdownRemaining.value = 0
    workCompleted = false
    breakCompleted = false
  }

  function snooze(durationSeconds: number) {
    stopCountdown()

    // Guard against snoozing a completed timer (race condition)
    if (mode.value === 'work' && workCompleted) return
    if (mode.value === 'break' && breakCompleted) return

    switch (mode.value) {
      case 'work': {
        // Extend the work timer: set duration to elapsed + snooze amount
        workTimer.setDuration(workTimer.elapsedSeconds.value + durationSeconds)

        break
      }
      case 'break': {
        // Extend the break timer
        breakTimer.setDuration(breakTimer.elapsedSeconds.value + durationSeconds)

        break
      }
      case 'countdown': {
        // Cancel countdown, return to work mode — preserve elapsed time for consistency
        workCompleted = false
        workTimer.setDuration(workTimer.elapsedSeconds.value + durationSeconds)
        workTimer.startTimer()
        mode.value = 'work'
        return
      }
      // No default
    }
  }

  function skipBreak() {
    stopCountdown()
    countdownRemaining.value = 0
    workCompleted = false
    breakCompleted = false
    mode.value = 'idle'
  }

  function dispose() {
    // Remove watchers
    if (workCompletionUnwatch) {
      workCompletionUnwatch()
      workCompletionUnwatch = null
    }
    if (breakCompletionUnwatch) {
      breakCompletionUnwatch()
      breakCompletionUnwatch = null
    }

    // Stop everything
    stopCountdown()
    workTimer.stopTimer()
    workTimer.resetTimer()
    breakTimer.stopTimer()
    breakTimer.resetTimer()
    mode.value = 'idle'
    countdownRemaining.value = 0
    workCompleted = false
    breakCompleted = false
  }

  // Watch work timer for completion
  workCompletionUnwatch = watch(
    () => workTimer.elapsedSeconds.value,
    elapsed => {
      if (workCompleted) return
      if (mode.value === 'work' && elapsed >= workTimer.duration.value) {
        workCompleted = true
        console.log('Work timer completed, elapsed:', elapsed, 'duration:', workTimer.duration.value)
        // Work timer completed
        workTimer.stopTimer()
        sendNotification('Work Complete!', 'Time for a break.')
        playSound(SoundType.WorkEnd)
        startCountdown()
      }
    },
  )

  // Watch break timer for completion
  breakCompletionUnwatch = watch(
    () => breakTimer.elapsedSeconds.value,
    elapsed => {
      if (breakCompleted) return
      if (mode.value === 'break' && elapsed >= breakTimer.duration.value) {
        breakCompleted = true
        console.log('Break timer completed, elapsed:', elapsed, 'duration:', breakTimer.duration.value)
        // Break timer completed
        breakTimer.stopTimer()
        sendNotification('Break Complete!', 'Ready to work again?')
        playSound(SoundType.BreakEnd)
        mode.value = 'idle'
      }
    },
  )

  return {
    mode,
    displayTimeString,
    timerRunning,
    countdownRemaining,
    start,
    stop,
    reset,
    snooze,
    skipBreak,
    dispose,
  }
}
