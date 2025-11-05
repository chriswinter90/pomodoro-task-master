<template>
  <div class="timer-panel">
    <div class="timer-list d-flex ml-8 mr-8">
      <template v-for="timer in timers.timers" :key="timer.id">
        <TimerBlock :timer-id="timer.id" :duration="timer.duration" />
      </template>
      <v-btn class="add-timer-btn h-auto" border="md" color="green">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>
    <TimerControls
      @start="currentTimer.startTimer()"
      @stop="currentTimer.stopTimer()"
      @reset="currentTimer.resetTimer()"
    />
    <TimerDisplay
      v-if="currentTimer"
      :elapsed-seconds="currentTimer.elapsedSeconds.value"
      :duration="currentTimer.duration.value"
      :display-time-string="currentTimer.displayTimeString.value"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTimersStore } from '@/stores/timers.ts'
  import { useTimer } from '@/components/composables/timer.ts'

  const timers = useTimersStore()

  let currentTimer = useTimer(0)

  watch(() => timers.selectedTimer, selectedTimer => {
    if (selectedTimer) currentTimer = useTimer(selectedTimer.duration, selectedTimer.id)
  })
</script>

<style scoped lang="scss">
  .timer-list > * {
    width: 100px;
    margin-right: 10px;
  }
</style>
