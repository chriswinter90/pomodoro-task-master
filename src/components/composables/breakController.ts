import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { useTimer, displayTime } from '@/components/composables/timer.ts'
import type { TimerData } from '@/stores/timers.ts'

export type BreakMode = 'idle' | 'work' | 'countdown' | 'break'

const COUNTDOWN_DURATION = 30 // seconds

export function useBreakController(timerData: TimerData) {
  const workTimerDuration = timerData.duration
  const breakTimerDuration = timerData.breakDuration ?? 300

  const mode = ref<BreakMode>('idle')
  const countdownRemaining = ref(0)

  // Work timer instance
  const workTimer = useTimer(workTimerDuration)
  // Break timer instance
  const breakTimer = useTimer(breakTimerDuration)

  // Countdown interval
  let countdownInterval: number | null = null

  // Notification permission state
  let notificationPermissionRequested = false

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

  function requestNotificationPermission(): Promise<'default' | 'denied' | 'granted'> {
    if (notificationPermissionRequested) {
      return Promise.resolve(Notification.permission)
    }
    notificationPermissionRequested = true
    return Notification.requestPermission()
  }

  function sendNotification(title: string, body: string) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body })
        console.log('Notification sent:', title)
      } else if (Notification.permission !== 'denied') {
        requestNotificationPermission().then(perm => {
          if (perm === 'granted') {
            new Notification(title, { body })
            console.log('Notification sent (after permission):', title)
          }
        })
      } else {
        console.warn('Notification permission denied')
      }
    } catch (e) {
      console.error('Failed to send notification:', e)
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
    requestNotificationPermission()
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

    if (mode.value === 'work') {
      // Extend the work timer: set duration to elapsed + snooze amount
      workTimer.setDuration(workTimer.elapsedSeconds.value + durationSeconds)
    } else if (mode.value === 'break') {
      // Extend the break timer
      breakTimer.setDuration(breakTimer.elapsedSeconds.value + durationSeconds)
    } else if (mode.value === 'countdown') {
      // Cancel countdown, return to work mode with snooze duration
      workCompleted = false
      workTimer.setDuration(durationSeconds)
      workTimer.resetTimer()
      workTimer.startTimer()
      mode.value = 'work'
      return
    }
  }

  function skipBreak() {
    stopCountdown()
    countdownRemaining.value = 0
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
    (elapsed) => {
      if (workCompleted) return
      if (mode.value === 'work' && elapsed >= workTimer.duration.value) {
        workCompleted = true
        console.log('Work timer completed, elapsed:', elapsed, 'duration:', workTimer.duration.value)
        // Work timer completed
        workTimer.stopTimer()
        sendNotification('Work Complete!', 'Time for a break.')
        startCountdown()
      }
    }
  )

  // Watch break timer for completion
  breakCompletionUnwatch = watch(
    () => breakTimer.elapsedSeconds.value,
    (elapsed) => {
      if (breakCompleted) return
      if (mode.value === 'break' && elapsed >= breakTimer.duration.value) {
        breakCompleted = true
        console.log('Break timer completed, elapsed:', elapsed, 'duration:', breakTimer.duration.value)
        // Break timer completed
        breakTimer.stopTimer()
        sendNotification('Break Complete!', 'Ready to work again?')
        mode.value = 'idle'
      }
    }
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
