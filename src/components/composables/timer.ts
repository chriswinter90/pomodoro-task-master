export function useTimer() {
  // timer id
  let timer = -1
  // how long the timer should run for
  const duration = ref(0)
  // how long the timer has been running for
  const elapsedSeconds = ref(0)

  const timeRemainingInSeconds = computed(() => duration.value - elapsedSeconds.value)

  const timeRemainingInMinutesDecimal = computed(() => timeRemainingInSeconds.value / 60)

  // TODO: Should this be something in the component instead?
  const displayTimeString = computed(() => {
    const minutes = Math.floor(timeRemainingInMinutesDecimal.value)
    const seconds = Math.floor(timeRemainingInSeconds.value % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  })

  const startTimer = () => {
    timer = setInterval(() => {
      elapsedSeconds.value++
    }, 1000)
  }

  const stopTimer = () => {
    clearInterval(timer)
  }
  const resetTimer = () => {
    elapsedSeconds.value = 0
  }

  return {
    duration,
    elapsedSeconds,
    displayTimeString,
    startTimer,
    stopTimer,
    resetTimer,
  }
}
