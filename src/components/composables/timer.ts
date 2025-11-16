import { v7 as uuid } from 'uuid'

export function displayTime(time: number) {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

export type Timer = ReturnType<typeof useTimer>

/**
 * Timer composable
 * @param timerDuration - how long the timer should run for
 * @param id - optional id for the timer
 */
export function useTimer(timerDuration: number, id?: string) {
  const timerId = id ?? uuid()
  // The interval id for the running timer
  const timerInterval = ref(-1)
  // how long the timer should run for
  const duration = ref(timerDuration)
  // how long the timer has been running for
  const elapsedSeconds = ref(0)
  // If the timer is running or not
  const timerRunning = computed(() => timerInterval.value !== -1)
  const timeRemainingInSeconds = computed(() => duration.value - elapsedSeconds.value)

  /**
   * Display time in minutes and seconds ex. 12:03
   */
  const displayTimeString = computed(() => {
    return displayTime(timeRemainingInSeconds.value)
  })

  const setDuration = (newDuration: number) => duration.value = newDuration

  const startTimer = () => {
    if (timerRunning.value) {
      console.warn('Timer is already running')
      return
    }

    timerInterval.value = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  }

  const stopTimer = () => {
    if (!timerRunning.value) {
      console.warn('Timer is not running')
      return
    }
    clearInterval(timerInterval.value)
    timerInterval.value = -1
  }

  const resetTimer = () => {
    clearInterval(timerInterval.value)
    timerInterval.value = -1
    elapsedSeconds.value = 0
  }

  return {
    timerId,
    duration,
    elapsedSeconds,
    displayTimeString,
    timerRunning,
    startTimer,
    stopTimer,
    resetTimer,
    setDuration,
  }
}
